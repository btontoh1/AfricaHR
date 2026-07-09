import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

    return request;
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

    return updated;
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
