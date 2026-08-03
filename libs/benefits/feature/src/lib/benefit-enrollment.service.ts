import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BenefitEnrollment, BenefitEnrollmentStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  BenefitEnrollmentRepository,
  BenefitEnrollmentWithPlan,
  BenefitPlanRepository,
  BenefitsEmployeeRepository,
} from '@africahr/benefits-data-access';
import { BenefitContribution, canCancelBenefitEnrollment, computeBenefitContribution } from '@africahr/benefits-domain';
import { CreateBenefitEnrollmentDto } from './dto/create-benefit-enrollment.dto';

/**
 * Emitted after a new enrollment is created. Unlike leave/performance,
 * benefit enrollment has no manager-review step (BenefitEnrollmentStatus
 * is just ACTIVE/CANCELLED - see project memory on why it's never
 * denormalized/pending), so there's no manager recipient here, only
 * tenant admins/HR managers (BENEFITS_MANAGE holders). actorUserId lets
 * the listener skip notifying whoever just created the enrollment: like
 * recruitment applications (not leave/performance), enrollment can be
 * created directly by BENEFITS_MANAGE-holding HR/admin staff on an
 * employee's behalf via BenefitEnrollmentController, not only
 * self-service, so without this they'd self-notify. Consumed by a
 * listener living in notifications-feature — scope:benefits is not
 * allowed to depend on scope:notifications directly (see
 * eslint.config.mjs module boundaries), so this event is the decoupling
 * point between the two. Both sides must agree on this literal string and
 * payload shape informally; there's no shared type between scopes for it.
 */
export const BENEFIT_ENROLLMENT_CREATED_EVENT = 'benefits.enrollment.created';

export interface BenefitEnrollmentCreatedEvent {
  tenantId: string;
  employeeName: string;
  planName: string;
  effectiveDate: string;
  actorUserId: string | null;
}

@Injectable()
export class BenefitEnrollmentService {
  constructor(
    private readonly enrollments: BenefitEnrollmentRepository,
    private readonly plans: BenefitPlanRepository,
    private readonly employees: BenefitsEmployeeRepository,
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

  async enrollForSelf(
    tenantId: string,
    userId: string,
    dto: CreateBenefitEnrollmentDto,
  ): Promise<BenefitEnrollment> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.enroll(tenantId, employeeId, dto.benefitPlanId, dto.effectiveDate, userId);
  }

  async enroll(
    tenantId: string,
    employeeId: string,
    benefitPlanId: string,
    effectiveDate?: string,
    actorId?: string,
  ): Promise<BenefitEnrollment> {
    const plan = await this.plans.findById(tenantId, benefitPlanId);
    if (!plan) {
      throw new NotFoundException(`Benefit plan "${benefitPlanId}" not found`);
    }
    if (!plan.isActive) {
      throw new ConflictException(`Benefit plan "${plan.name}" is not active`);
    }

    const existing = await this.enrollments.findActiveByEmployeeAndPlan(tenantId, employeeId, benefitPlanId);
    if (existing) {
      throw new ConflictException('Already enrolled in this benefit plan');
    }

    let enrollment: BenefitEnrollment;
    try {
      enrollment = await this.enrollments.create(tenantId, {
        employeeId,
        benefitPlanId,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
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
      action: 'benefits.enrollment.created',
      resourceType: 'BenefitEnrollment',
      resourceId: enrollment.id,
    });

    await this.notifyOfNewEnrollment(tenantId, enrollment, plan.name, actorId);

    return enrollment;
  }

  /** Silent no-op if the employee can no longer be found - not an error condition here. */
  private async notifyOfNewEnrollment(
    tenantId: string,
    enrollment: BenefitEnrollment,
    planName: string,
    actorId?: string,
  ): Promise<void> {
    const employee = await this.employees.findById(tenantId, enrollment.employeeId);
    if (!employee) {
      return;
    }

    const event: BenefitEnrollmentCreatedEvent = {
      tenantId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      planName,
      effectiveDate: enrollment.effectiveDate.toISOString().slice(0, 10),
      actorUserId: actorId ?? null,
    };
    this.eventEmitter.emit(BENEFIT_ENROLLMENT_CREATED_EVENT, event);
  }

  async findById(tenantId: string, id: string): Promise<BenefitEnrollmentWithPlan> {
    const enrollment = await this.enrollments.findById(tenantId, id);
    if (!enrollment) {
      throw new NotFoundException(`Benefit enrollment "${id}" not found`);
    }
    return enrollment;
  }

  list(
    tenantId: string,
    params: { employeeId?: string; benefitPlanId?: string; status?: BenefitEnrollmentStatus } = {},
  ): Promise<BenefitEnrollmentWithPlan[]> {
    return this.enrollments.list(tenantId, params);
  }

  async listForSelf(tenantId: string, userId: string): Promise<BenefitEnrollmentWithPlan[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.enrollments.list(tenantId, { employeeId });
  }

  async cancelForSelf(tenantId: string, userId: string, id: string): Promise<BenefitEnrollment> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const enrollment = await this.findById(tenantId, id);
    if (enrollment.employeeId !== employeeId) {
      // Don't reveal that an enrollment belonging to someone else exists.
      throw new NotFoundException(`Benefit enrollment "${id}" not found`);
    }
    return this.cancel(tenantId, id, userId);
  }

  async cancel(tenantId: string, id: string, actorId?: string): Promise<BenefitEnrollment> {
    const enrollment = await this.findById(tenantId, id);
    if (!canCancelBenefitEnrollment(enrollment.status)) {
      throw new ConflictException(`Cannot cancel a benefit enrollment in status ${enrollment.status}`);
    }

    const updated = await this.enrollments.updateStatus(tenantId, id, 'CANCELLED', new Date(), actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'benefits.enrollment.cancelled',
      resourceType: 'BenefitEnrollment',
      resourceId: id,
    });

    return updated;
  }

  async getContributionForSelf(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<BenefitContribution> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const enrollment = await this.findById(tenantId, id);
    if (enrollment.employeeId !== employeeId) {
      // Don't reveal that an enrollment belonging to someone else exists.
      throw new NotFoundException(`Benefit enrollment "${id}" not found`);
    }
    return this.getContribution(tenantId, id);
  }

  /** Live-computed current contribution — never denormalized (see project memory). */
  async getContribution(tenantId: string, id: string): Promise<BenefitContribution> {
    const enrollment = await this.findById(tenantId, id);
    const employee = await this.employees.findById(tenantId, enrollment.employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee "${enrollment.employeeId}" not found`);
    }

    return computeBenefitContribution(
      enrollment.benefitPlan.contributionType,
      {
        employeeContribution: Number(enrollment.benefitPlan.employeeContribution),
        employerContribution: Number(enrollment.benefitPlan.employerContribution),
      },
      employee.baseSalary ? Number(employee.baseSalary) : 0,
    );
  }
}
