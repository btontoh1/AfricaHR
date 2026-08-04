import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeaveBalance, LeaveRequest, LeaveType, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  LeaveBalanceRepository,
  LeaveEmployeeRepository,
  LeaveRequestRepository,
  LeaveTypeRepository,
} from '@africahr/leave-data-access';
import {
  canTransitionLeaveRequestStatus,
  countWorkingDays,
  hasSufficientBalance,
  LeaveRequestStatus,
  remainingDays,
} from '@africahr/leave-domain';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';

export interface LeaveRequestWithEmployeeName extends LeaveRequest {
  employeeName: string;
}

/**
 * Emitted after every leave request is created. managerUserId is null when
 * the employee has no manager, or that manager has no portal access (no
 * linked User) - the listener still notifies whoever can approve leave
 * tenant-wide (TENANT_ADMIN/HR_MANAGER) even when there's no manager to
 * also notify. Consumed by a listener living in notifications-feature —
 * scope:leave is not allowed to depend on scope:notifications directly
 * (see eslint.config.mjs module boundaries), so this event is the
 * decoupling point between the two. Both sides must agree on this literal
 * string and payload shape informally; there's no shared type between
 * scopes for it.
 */
export const LEAVE_REQUEST_CREATED_EVENT = 'leave.request.created';

export interface LeaveRequestCreatedEvent {
  tenantId: string;
  managerUserId: string | null;
  employeeName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
}

/**
 * Emitted after a leave request is approved, rejected, or cancelled -
 * notifying the employee whose request it is. Unlike
 * LeaveRequestCreatedEvent's manager/HR audience, this always has a single
 * recipient (the employee), so actorUserId is used to skip
 * self-notification: approve()/reject() are always done by someone else
 * (a manager or HR/admin), but cancelRequest() can be the employee acting
 * on their own request (cancelForSelf), so without this they'd be told
 * about their own cancellation. Consumed by a listener living in
 * notifications-feature — see LeaveRequestCreatedEvent's doc comment for
 * why this event is a plain string/payload contract rather than a shared
 * type.
 */
export const LEAVE_REQUEST_DECIDED_EVENT = 'leave.request.decided';

export interface LeaveRequestDecidedEvent {
  tenantId: string;
  employeeUserId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  status: LeaveRequest['status'];
  rejectionReason: string | null;
  actorUserId: string | null;
}

interface EffectiveBalance {
  balance: LeaveBalance | null;
  leaveType: LeaveType;
  entitledDays: number;
  usedDays: number;
}

@Injectable()
export class LeaveRequestService {
  constructor(
    private readonly requests: LeaveRequestRepository,
    private readonly balances: LeaveBalanceRepository,
    private readonly leaveTypes: LeaveTypeRepository,
    private readonly employees: LeaveEmployeeRepository,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Resolves the caller's own Employee id from their User id — the basis for every self-service method below. */
  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async createForSelf(
    tenantId: string,
    userId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.create(tenantId, employeeId, dto, userId);
  }

  async create(
    tenantId: string,
    employeeId: string,
    dto: CreateLeaveRequestDto,
    actorId?: string,
  ): Promise<LeaveRequest> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('endDate must not be before startDate');
    }

    const daysRequested = countWorkingDays(startDate, endDate);
    if (daysRequested === 0) {
      throw new BadRequestException('The requested date range contains no working days');
    }

    const year = startDate.getUTCFullYear();
    const { entitledDays, usedDays } = await this.resolveEffectiveBalance(
      tenantId,
      employeeId,
      dto.leaveTypeId,
      year,
    );

    if (!hasSufficientBalance(entitledDays, usedDays, daysRequested)) {
      throw new ConflictException(
        `Insufficient balance: ${remainingDays(entitledDays, usedDays)} day(s) remaining, ${daysRequested} requested`,
      );
    }

    let request: LeaveRequest;
    try {
      request = await this.requests.create(tenantId, {
        employeeId,
        leaveTypeId: dto.leaveTypeId,
        startDate,
        endDate,
        daysRequested,
        reason: dto.reason,
        createdBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException(`Employee "${employeeId}" not found`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'leave.request.created',
      resourceType: 'LeaveRequest',
      resourceId: request.id,
    });

    await this.notifyOfNewRequest(tenantId, employeeId, request);

    return request;
  }

  /**
   * Always emits, even when there's no manager to notify - the listener
   * separately notifies tenant admins/HR managers regardless, so a missing
   * manager shouldn't suppress the event entirely (see
   * LeaveRequestCreatedEvent's doc comment). Silently resolves
   * managerUserId to null rather than throwing when the employee record or
   * its manager can't be found - not an error condition here.
   */
  private async notifyOfNewRequest(
    tenantId: string,
    employeeId: string,
    request: LeaveRequest,
  ): Promise<void> {
    const employee = await this.employees.findById(tenantId, employeeId);
    if (!employee) {
      return;
    }

    let managerUserId: string | null = null;
    if (employee.managerId) {
      const manager = await this.employees.findById(tenantId, employee.managerId);
      managerUserId = manager?.userId ?? null;
    }

    const leaveType = await this.leaveTypes.findById(tenantId, request.leaveTypeId);

    const event: LeaveRequestCreatedEvent = {
      tenantId,
      managerUserId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveTypeName: leaveType?.name ?? 'Leave',
      startDate: request.startDate.toISOString().slice(0, 10),
      endDate: request.endDate.toISOString().slice(0, 10),
    };
    this.eventEmitter.emit(LEAVE_REQUEST_CREATED_EVENT, event);
  }

  /** Silent no-op if the employee can no longer be found or has no portal access. */
  private async notifyOfDecision(
    tenantId: string,
    request: LeaveRequest,
    actorId?: string,
  ): Promise<void> {
    const employee = await this.employees.findById(tenantId, request.employeeId);
    if (!employee?.userId) {
      return;
    }

    const leaveType = await this.leaveTypes.findById(tenantId, request.leaveTypeId);

    const event: LeaveRequestDecidedEvent = {
      tenantId,
      employeeUserId: employee.userId,
      leaveTypeName: leaveType?.name ?? 'Leave',
      startDate: request.startDate.toISOString().slice(0, 10),
      endDate: request.endDate.toISOString().slice(0, 10),
      status: request.status,
      rejectionReason: request.rejectionReason,
      actorUserId: actorId ?? null,
    };
    this.eventEmitter.emit(LEAVE_REQUEST_DECIDED_EVENT, event);
  }

  async findById(tenantId: string, id: string): Promise<LeaveRequest> {
    const request = await this.requests.findById(tenantId, id);
    if (!request) {
      throw new NotFoundException(`Leave request "${id}" not found`);
    }
    return request;
  }

  list(
    tenantId: string,
    params: { employeeId?: string; status?: LeaveRequestStatus } = {},
  ): Promise<LeaveRequest[]> {
    return this.requests.list(tenantId, params);
  }

  async listForSelf(tenantId: string, userId: string): Promise<LeaveRequest[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.requests.list(tenantId, { employeeId });
  }

  /**
   * Requests for the caller's direct reports only (not skip-level).
   * Enriched with each report's name: the caller is a plain EMPLOYEE
   * (manager-of-X, not a LEAVE_MANAGE holder), so unlike the HR-facing
   * list they cannot resolve names themselves via EMPLOYEE_READ. Mirrors
   * PerformanceReviewService.listForDirectReports exactly.
   */
  async listForDirectReports(tenantId: string, userId: string): Promise<LeaveRequestWithEmployeeName[]> {
    const managerEmployeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const reportIds = await this.employees.listDirectReportIds(tenantId, managerEmployeeId);
    if (reportIds.length === 0) {
      return [];
    }
    const [perReport, names] = await Promise.all([
      Promise.all(reportIds.map((employeeId) => this.requests.list(tenantId, { employeeId }))),
      this.employees.findManyByIds(tenantId, reportIds),
    ]);
    const nameById = new Map(names.map((employee) => [employee.id, `${employee.firstName} ${employee.lastName}`]));
    return perReport.flat().map((request) => ({
      ...request,
      employeeName: nameById.get(request.employeeId) ?? request.employeeId,
    }));
  }

  async cancelForSelf(tenantId: string, userId: string, id: string): Promise<LeaveRequest> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const request = await this.findById(tenantId, id);
    if (request.employeeId !== employeeId) {
      // Don't reveal that a request belonging to someone else exists.
      throw new NotFoundException(`Leave request "${id}" not found`);
    }
    return this.cancelRequest(tenantId, request, userId);
  }

  async cancel(tenantId: string, id: string, actorId?: string): Promise<LeaveRequest> {
    const request = await this.findById(tenantId, id);
    return this.cancelRequest(tenantId, request, actorId);
  }

  private async cancelRequest(
    tenantId: string,
    request: LeaveRequest,
    actorId?: string,
  ): Promise<LeaveRequest> {
    if (!canTransitionLeaveRequestStatus(request.status, LeaveRequestStatus.CANCELLED)) {
      throw new ConflictException(`Cannot cancel a leave request in status ${request.status}`);
    }

    const wasApproved = request.status === LeaveRequestStatus.APPROVED;
    const updated = await this.requests.updateStatus(tenantId, request.id, {
      status: LeaveRequestStatus.CANCELLED,
      updatedBy: actorId,
    });

    if (wasApproved) {
      const year = request.startDate.getUTCFullYear();
      const balance = await this.balances.findByEmployeeAndType(
        tenantId,
        request.employeeId,
        request.leaveTypeId,
        year,
      );
      if (balance) {
        await this.balances.decrementUsedDays(tenantId, balance.id, request.daysRequested, actorId);
      }
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'leave.request.cancelled',
      resourceType: 'LeaveRequest',
      resourceId: request.id,
    });

    await this.notifyOfDecision(tenantId, updated, actorId);

    return updated;
  }

  async approveAsManager(tenantId: string, userId: string, id: string): Promise<LeaveRequest> {
    const request = await this.findById(tenantId, id);
    await this.assertIsDirectManager(tenantId, userId, request.employeeId);
    return this.approve(tenantId, id, userId);
  }

  async rejectAsManager(
    tenantId: string,
    userId: string,
    id: string,
    rejectionReason: string,
  ): Promise<LeaveRequest> {
    const request = await this.findById(tenantId, id);
    await this.assertIsDirectManager(tenantId, userId, request.employeeId);
    return this.reject(tenantId, id, rejectionReason, userId);
  }

  private async assertIsDirectManager(
    tenantId: string,
    userId: string,
    targetEmployeeId: string,
  ): Promise<void> {
    const managerEmployeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const targetEmployee = await this.employees.findById(tenantId, targetEmployeeId);
    if (!targetEmployee || targetEmployee.managerId !== managerEmployeeId) {
      throw new ForbiddenException('You are not the direct manager of this employee');
    }
  }

  async approve(tenantId: string, id: string, approverUserId?: string): Promise<LeaveRequest> {
    const request = await this.findById(tenantId, id);
    if (!canTransitionLeaveRequestStatus(request.status, LeaveRequestStatus.APPROVED)) {
      throw new ConflictException(`Cannot approve a leave request in status ${request.status}`);
    }

    const year = request.startDate.getUTCFullYear();
    const { balance, leaveType, entitledDays, usedDays } = await this.resolveEffectiveBalance(
      tenantId,
      request.employeeId,
      request.leaveTypeId,
      year,
    );

    const daysRequested = Number(request.daysRequested);
    if (!hasSufficientBalance(entitledDays, usedDays, daysRequested)) {
      throw new ConflictException(
        `Insufficient balance to approve: ${remainingDays(entitledDays, usedDays)} day(s) remaining, ${daysRequested} requested`,
      );
    }

    const balanceId =
      balance?.id ??
      (
        await this.balances.upsertEntitlement(tenantId, {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year,
          entitledDays: leaveType.defaultEntitlementDays,
          actorId: approverUserId,
        })
      ).id;

    await this.balances.incrementUsedDays(tenantId, balanceId, daysRequested, approverUserId);

    const updated = await this.requests.updateStatus(tenantId, id, {
      status: LeaveRequestStatus.APPROVED,
      approverUserId,
      approvedAt: new Date(),
      updatedBy: approverUserId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: approverUserId ?? null,
      action: 'leave.request.approved',
      resourceType: 'LeaveRequest',
      resourceId: id,
    });

    await this.notifyOfDecision(tenantId, updated, approverUserId);

    return updated;
  }

  async reject(
    tenantId: string,
    id: string,
    rejectionReason: string,
    approverUserId?: string,
  ): Promise<LeaveRequest> {
    const request = await this.findById(tenantId, id);
    if (!canTransitionLeaveRequestStatus(request.status, LeaveRequestStatus.REJECTED)) {
      throw new ConflictException(`Cannot reject a leave request in status ${request.status}`);
    }

    const updated = await this.requests.updateStatus(tenantId, id, {
      status: LeaveRequestStatus.REJECTED,
      approverUserId,
      rejectionReason,
      updatedBy: approverUserId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: approverUserId ?? null,
      action: 'leave.request.rejected',
      resourceType: 'LeaveRequest',
      resourceId: id,
      metadata: { rejectionReason },
    });

    await this.notifyOfDecision(tenantId, updated, approverUserId);

    return updated;
  }

  private async resolveEffectiveBalance(
    tenantId: string,
    employeeId: string,
    leaveTypeId: string,
    year: number,
  ): Promise<EffectiveBalance> {
    const leaveType = await this.leaveTypes.findById(tenantId, leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type "${leaveTypeId}" not found`);
    }

    const balance = await this.balances.findByEmployeeAndType(tenantId, employeeId, leaveTypeId, year);

    return {
      balance,
      leaveType,
      entitledDays: balance ? Number(balance.entitledDays) : Number(leaveType.defaultEntitlementDays),
      usedDays: balance ? Number(balance.usedDays) : 0,
    };
  }
}
