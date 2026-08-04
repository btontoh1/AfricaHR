import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JobRequisition, JobRequisitionStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { canTransitionRequisitionStatus } from '@africahr/recruitment-domain';
import { JobRequisitionRepository, RecruitmentEmployeeRepository } from '@africahr/recruitment-data-access';
import { CreateJobRequisitionDto } from './dto/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from './dto/update-job-requisition.dto';

/**
 * Emitted after a new requisition is created. hiringManagerUserId is null
 * when the requisition has no hiring manager assigned yet, or that
 * manager has no portal access (no linked User) - the listener still
 * notifies tenant admins/HR managers regardless (mirrors
 * ApplicationService's RecruitmentApplicationCreatedEvent - see its doc
 * comment). actorUserId lets the listener skip notifying whoever just
 * created the requisition: like applications, requisitions can only be
 * created by RECRUITMENT_MANAGE-holding HR/admin staff (see
 * JobRequisitionController - there's no self-service create), so without
 * this they'd self-notify every time they create one. Consumed by a
 * listener living in notifications-feature — scope:recruitment is not
 * allowed to depend on scope:notifications directly (see
 * eslint.config.mjs module boundaries), so this event is the decoupling
 * point between the two. Both sides must agree on this literal string and
 * payload shape informally; there's no shared type between scopes for it.
 */
export const RECRUITMENT_REQUISITION_CREATED_EVENT = 'recruitment.requisition.created';

export interface RecruitmentRequisitionCreatedEvent {
  tenantId: string;
  hiringManagerUserId: string | null;
  jobTitle: string;
  actorUserId: string | null;
}

@Injectable()
export class JobRequisitionService {
  constructor(
    private readonly requisitions: JobRequisitionRepository,
    private readonly employees: RecruitmentEmployeeRepository,
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

  async create(
    tenantId: string,
    dto: CreateJobRequisitionDto,
    actorId?: string,
  ): Promise<JobRequisition> {
    let requisition: JobRequisition;
    try {
      requisition = await this.requisitions.create(tenantId, {
        organizationId: dto.organizationId,
        organizationUnitId: dto.organizationUnitId,
        hiringManagerId: dto.hiringManagerId,
        title: dto.title,
        description: dto.description,
        employmentType: dto.employmentType,
        openings: dto.openings,
        targetHireDate: dto.targetHireDate ? new Date(dto.targetHireDate) : undefined,
        createdBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException(
          'Referenced organization, organization unit, or hiring manager not found',
        );
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'recruitment.requisition.created',
      resourceType: 'JobRequisition',
      resourceId: requisition.id,
    });

    await this.notifyOfNewRequisition(tenantId, requisition, actorId);

    return requisition;
  }

  /**
   * Always emits, even when the requisition has no hiring manager - the
   * listener separately notifies tenant admins/HR managers regardless
   * (see RecruitmentRequisitionCreatedEvent's doc comment).
   */
  private async notifyOfNewRequisition(
    tenantId: string,
    requisition: JobRequisition,
    actorId?: string,
  ): Promise<void> {
    let hiringManagerUserId: string | null = null;
    if (requisition.hiringManagerId) {
      const manager = await this.employees.findById(tenantId, requisition.hiringManagerId);
      hiringManagerUserId = manager?.userId ?? null;
    }

    const event: RecruitmentRequisitionCreatedEvent = {
      tenantId,
      hiringManagerUserId,
      jobTitle: requisition.title,
      actorUserId: actorId ?? null,
    };
    this.eventEmitter.emit(RECRUITMENT_REQUISITION_CREATED_EVENT, event);
  }

  async findById(tenantId: string, id: string): Promise<JobRequisition> {
    const requisition = await this.requisitions.findById(tenantId, id);
    if (!requisition) {
      throw new NotFoundException(`Job requisition "${id}" not found`);
    }
    return requisition;
  }

  list(
    tenantId: string,
    params: { organizationId?: string; hiringManagerId?: string; status?: JobRequisitionStatus } = {},
  ): Promise<JobRequisition[]> {
    return this.requisitions.list(tenantId, params);
  }

  /** Requisitions where the caller is the hiring manager. */
  async listForHiringManager(tenantId: string, userId: string): Promise<JobRequisition[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.requisitions.list(tenantId, { hiringManagerId: employeeId });
  }

  async findByIdForHiringManager(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<JobRequisition> {
    const requisition = await this.findById(tenantId, id);
    await this.assertIsHiringManager(tenantId, userId, requisition);
    return requisition;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateJobRequisitionDto,
    actorId?: string,
  ): Promise<JobRequisition> {
    const requisition = await this.findById(tenantId, id);
    // Only a genuine status change goes through the transition guard -
    // status is one of several optional fields on this general-purpose
    // PATCH, so a caller updating e.g. just the title while re-sending the
    // requisition's current status isn't attempting a transition at all.
    if (dto.status !== undefined && dto.status !== requisition.status) {
      this.assertStatusTransition(requisition.status, dto.status);
    }

    let updated: JobRequisition;
    try {
      updated = await this.requisitions.update(tenantId, id, {
        title: dto.title,
        description: dto.description,
        organizationUnitId: dto.organizationUnitId,
        hiringManagerId: dto.hiringManagerId,
        openings: dto.openings,
        status: dto.status,
        targetHireDate:
          dto.targetHireDate !== undefined
            ? dto.targetHireDate
              ? new Date(dto.targetHireDate)
              : null
            : undefined,
        updatedBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException('Referenced organization unit or hiring manager not found');
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'recruitment.requisition.updated',
      resourceType: 'JobRequisition',
      resourceId: id,
    });

    return updated;
  }

  async updateForHiringManager(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateJobRequisitionDto,
  ): Promise<JobRequisition> {
    const requisition = await this.findById(tenantId, id);
    await this.assertIsHiringManager(tenantId, userId, requisition);
    return this.update(tenantId, id, dto, userId);
  }

  private assertStatusTransition(from: JobRequisitionStatus, to: JobRequisitionStatus): void {
    if (!canTransitionRequisitionStatus(from, to)) {
      throw new ConflictException(`Cannot move a requisition from ${from} to ${to}`);
    }
  }

  private async assertIsHiringManager(
    tenantId: string,
    userId: string,
    requisition: JobRequisition,
  ): Promise<void> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    if (requisition.hiringManagerId !== employeeId) {
      throw new ForbiddenException('You are not the hiring manager for this requisition');
    }
  }
}
