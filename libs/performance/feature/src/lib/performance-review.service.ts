import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PerformanceReview, PerformanceReviewStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  PerformanceEmployeeRepository,
  PerformanceReviewCycleRepository,
  PerformanceReviewRepository,
} from '@africahr/performance-data-access';
import { canTransitionReviewStatus } from '@africahr/performance-domain';
import { SubmitManagerAssessmentDto } from './dto/submit-manager-assessment.dto';
import { SubmitSelfAssessmentDto } from './dto/submit-self-assessment.dto';

export type PerformanceReviewWithEmployeeName = PerformanceReview & { employeeName: string };

/**
 * Emitted after an employee submits their self-assessment. managerUserId
 * is null when the employee has no manager, or that manager has no portal
 * access (no linked User) - the listener still notifies tenant admins/HR
 * managers regardless (mirrors leave-feature's LeaveRequestCreatedEvent).
 * Consumed by a listener living in notifications-feature — scope:performance
 * is not allowed to depend on scope:notifications directly (see
 * eslint.config.mjs module boundaries), so this event is the decoupling
 * point between the two. Both sides must agree on this literal string and
 * payload shape informally; there's no shared type between scopes for it.
 */
export const PERFORMANCE_REVIEW_SELF_SUBMITTED_EVENT = 'performance.review.self_submitted';

export interface PerformanceReviewSelfSubmittedEvent {
  tenantId: string;
  managerUserId: string | null;
  employeeName: string;
  cycleName: string;
}

/**
 * Emitted after a manager completes their assessment, notifying the
 * reviewee that their review is done. Unlike
 * PerformanceReviewSelfSubmittedEvent, there's no actor-exclusion field:
 * the manager (actor) is never the recipient here since the recipient is
 * always the employee the review is about, so self-notification can't
 * happen. Only emitted when the employee has portal access (a linked
 * User) - see notifyOfReviewCompleted. Consumed by a listener living in
 * notifications-feature — see PerformanceReviewSelfSubmittedEvent's doc
 * comment for why this event is a plain string/payload contract rather
 * than a shared type.
 */
export const PERFORMANCE_REVIEW_COMPLETED_EVENT = 'performance.review.completed';

export interface PerformanceReviewCompletedEvent {
  tenantId: string;
  employeeUserId: string;
  cycleName: string;
}

@Injectable()
export class PerformanceReviewService {
  constructor(
    private readonly reviews: PerformanceReviewRepository,
    private readonly cycles: PerformanceReviewCycleRepository,
    private readonly employees: PerformanceEmployeeRepository,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async startForSelf(tenantId: string, userId: string, cycleId: string): Promise<PerformanceReview> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.start(tenantId, employeeId, cycleId, userId);
  }

  async start(
    tenantId: string,
    employeeId: string,
    cycleId: string,
    actorId?: string,
  ): Promise<PerformanceReview> {
    const cycle = await this.cycles.findById(tenantId, cycleId);
    if (!cycle) {
      throw new NotFoundException(`Review cycle "${cycleId}" not found`);
    }

    const existing = await this.reviews.findByEmployeeAndCycle(tenantId, employeeId, cycleId);
    if (existing) {
      throw new ConflictException('A review already exists for this employee and cycle');
    }

    let review: PerformanceReview;
    try {
      review = await this.reviews.create(tenantId, { employeeId, cycleId, createdBy: actorId });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException(`Employee "${employeeId}" not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('A review already exists for this employee and cycle');
        }
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'performance.review.started',
      resourceType: 'PerformanceReview',
      resourceId: review.id,
    });

    return review;
  }

  async findById(tenantId: string, id: string): Promise<PerformanceReview> {
    const review = await this.reviews.findById(tenantId, id);
    if (!review) {
      throw new NotFoundException(`Performance review "${id}" not found`);
    }
    return review;
  }

  async findByIdForSelf(tenantId: string, userId: string, id: string): Promise<PerformanceReview> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const review = await this.findById(tenantId, id);
    if (review.employeeId !== employeeId) {
      throw new NotFoundException(`Performance review "${id}" not found`);
    }
    return review;
  }

  async findByIdForManager(tenantId: string, userId: string, id: string): Promise<PerformanceReview> {
    const review = await this.findById(tenantId, id);
    await this.assertIsDirectManager(tenantId, userId, review.employeeId);
    return review;
  }

  list(
    tenantId: string,
    params: { employeeId?: string; cycleId?: string; status?: PerformanceReviewStatus } = {},
  ): Promise<PerformanceReview[]> {
    return this.reviews.list(tenantId, params);
  }

  async listForSelf(tenantId: string, userId: string): Promise<PerformanceReview[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.reviews.list(tenantId, { employeeId });
  }

  /**
   * Reviews for the caller's direct reports only (not skip-level).
   * Enriched with each report's name: the caller is a plain EMPLOYEE
   * (manager-of-X, not an HR permission holder), so unlike the HR-facing
   * list they cannot resolve names themselves via EMPLOYEE_READ.
   */
  async listForDirectReports(tenantId: string, userId: string): Promise<PerformanceReviewWithEmployeeName[]> {
    const managerEmployeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const reportIds = await this.employees.listDirectReportIds(tenantId, managerEmployeeId);
    if (reportIds.length === 0) {
      return [];
    }
    const [perReport, names] = await Promise.all([
      Promise.all(reportIds.map((employeeId) => this.reviews.list(tenantId, { employeeId }))),
      this.employees.findManyByIds(tenantId, reportIds),
    ]);
    const nameById = new Map(names.map((employee) => [employee.id, `${employee.firstName} ${employee.lastName}`]));
    return perReport.flat().map((review) => ({
      ...review,
      employeeName: nameById.get(review.employeeId) ?? review.employeeId,
    }));
  }

  async submitSelfAssessmentForSelf(
    tenantId: string,
    userId: string,
    id: string,
    dto: SubmitSelfAssessmentDto,
  ): Promise<PerformanceReview> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const review = await this.findById(tenantId, id);
    if (review.employeeId !== employeeId) {
      throw new NotFoundException(`Performance review "${id}" not found`);
    }
    return this.submitSelfAssessment(tenantId, id, dto, userId);
  }

  async submitSelfAssessment(
    tenantId: string,
    id: string,
    dto: SubmitSelfAssessmentDto,
    actorId?: string,
  ): Promise<PerformanceReview> {
    const review = await this.findById(tenantId, id);
    if (!canTransitionReviewStatus(review.status, 'SELF_SUBMITTED')) {
      throw new ConflictException(`Cannot submit a self-assessment for a review in status ${review.status}`);
    }

    const updated = await this.reviews.update(tenantId, id, {
      status: 'SELF_SUBMITTED',
      selfRating: dto.selfRating,
      selfComments: dto.selfComments,
      selfSubmittedAt: new Date(),
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'performance.review.self_submitted',
      resourceType: 'PerformanceReview',
      resourceId: id,
    });

    await this.notifyOfSelfAssessment(tenantId, updated);

    return updated;
  }

  /**
   * Always emits, even when there's no manager to notify - the listener
   * separately notifies tenant admins/HR managers regardless (see
   * PerformanceReviewSelfSubmittedEvent's doc comment).
   */
  private async notifyOfSelfAssessment(tenantId: string, review: PerformanceReview): Promise<void> {
    const employee = await this.employees.findById(tenantId, review.employeeId);
    if (!employee) {
      return;
    }

    let managerUserId: string | null = null;
    if (employee.managerId) {
      const manager = await this.employees.findById(tenantId, employee.managerId);
      managerUserId = manager?.userId ?? null;
    }

    const [names, cycle] = await Promise.all([
      this.employees.findManyByIds(tenantId, [review.employeeId]),
      this.cycles.findById(tenantId, review.cycleId),
    ]);
    const employeeName = names[0] ? `${names[0].firstName} ${names[0].lastName}` : 'An employee';

    const event: PerformanceReviewSelfSubmittedEvent = {
      tenantId,
      managerUserId,
      employeeName,
      cycleName: cycle?.name ?? 'Performance review',
    };
    this.eventEmitter.emit(PERFORMANCE_REVIEW_SELF_SUBMITTED_EVENT, event);
  }

  async submitManagerAssessmentAsManager(
    tenantId: string,
    userId: string,
    id: string,
    dto: SubmitManagerAssessmentDto,
  ): Promise<PerformanceReview> {
    const review = await this.findById(tenantId, id);
    await this.assertIsDirectManager(tenantId, userId, review.employeeId);
    return this.submitManagerAssessment(tenantId, id, dto, userId);
  }

  async submitManagerAssessment(
    tenantId: string,
    id: string,
    dto: SubmitManagerAssessmentDto,
    actorId?: string,
  ): Promise<PerformanceReview> {
    const review = await this.findById(tenantId, id);
    if (!canTransitionReviewStatus(review.status, 'COMPLETED')) {
      throw new ConflictException(
        `Cannot submit a manager assessment for a review in status ${review.status}`,
      );
    }

    const updated = await this.reviews.update(tenantId, id, {
      status: 'COMPLETED',
      managerRating: dto.managerRating,
      managerComments: dto.managerComments,
      managerUserId: actorId,
      managerReviewedAt: new Date(),
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'performance.review.completed',
      resourceType: 'PerformanceReview',
      resourceId: id,
    });

    await this.notifyOfReviewCompleted(tenantId, updated);

    return updated;
  }

  /** Silent no-op if the employee can no longer be found or has no portal access. */
  private async notifyOfReviewCompleted(tenantId: string, review: PerformanceReview): Promise<void> {
    const employee = await this.employees.findById(tenantId, review.employeeId);
    if (!employee?.userId) {
      return;
    }

    const cycle = await this.cycles.findById(tenantId, review.cycleId);

    const event: PerformanceReviewCompletedEvent = {
      tenantId,
      employeeUserId: employee.userId,
      cycleName: cycle?.name ?? 'Performance review',
    };
    this.eventEmitter.emit(PERFORMANCE_REVIEW_COMPLETED_EVENT, event);
  }

  /**
   * Undoes a review started for the wrong employee/cycle, or one nobody
   * intends to finish. Only reachable from DRAFT/SELF_SUBMITTED - a
   * COMPLETED review is a finalized record, not a mistake to undo (see
   * canTransitionReviewStatus's doc comment). No notification: unlike
   * completion, there's no one who needs to be told a review that was
   * never finished is being withdrawn.
   */
  async cancel(tenantId: string, id: string, actorId?: string): Promise<PerformanceReview> {
    const review = await this.findById(tenantId, id);
    if (!canTransitionReviewStatus(review.status, 'CANCELLED')) {
      throw new ConflictException(`Cannot cancel a review in status ${review.status}`);
    }

    const updated = await this.reviews.update(tenantId, id, {
      status: 'CANCELLED',
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'performance.review.cancelled',
      resourceType: 'PerformanceReview',
      resourceId: id,
    });

    return updated;
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
}
