import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class BenefitEnrollmentService {
  constructor(
    private readonly enrollments: BenefitEnrollmentRepository,
    private readonly plans: BenefitPlanRepository,
    private readonly employees: BenefitsEmployeeRepository,
    private readonly audit: AuditService,
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

    return enrollment;
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
