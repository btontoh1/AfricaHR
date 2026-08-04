import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Application, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { canTransitionApplicationStage } from '@africahr/recruitment-domain';
import {
  ApplicationRepository,
  ApplicationWithRelations,
  JobRequisitionRepository,
  RecruitmentEmployeeRepository,
} from '@africahr/recruitment-data-access';
import { AdvanceApplicationDto } from './dto/advance-application.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { LinkHiredEmployeeDto } from './dto/link-hired-employee.dto';
import { RespondToOfferDto } from './dto/respond-to-offer.dto';
import { SendOfferDto } from './dto/send-offer.dto';

/**
 * Emitted after a new application is logged. hiringManagerUserId is null
 * when the requisition has no hiring manager, or that manager has no
 * portal access (no linked User) - the listener still notifies tenant
 * admins/HR managers regardless (mirrors leave-feature's
 * LeaveRequestCreatedEvent). actorUserId lets the listener skip notifying
 * whoever just logged the application themselves - unlike a leave request
 * (always created by the employee it's about) or a self-assessment
 * (always created by the reviewee), applications are logged by
 * RECRUITMENT_MANAGE-holding HR/admin staff on a candidate's behalf, who
 * would otherwise self-notify every time. Consumed by a listener living in
 * notifications-feature — scope:recruitment is not allowed to depend on
 * scope:notifications directly (see eslint.config.mjs module boundaries),
 * so this event is the decoupling point between the two. Both sides must
 * agree on this literal string and payload shape informally; there's no
 * shared type between scopes for it.
 */
export const RECRUITMENT_APPLICATION_CREATED_EVENT = 'recruitment.application.created';

export interface RecruitmentApplicationCreatedEvent {
  tenantId: string;
  hiringManagerUserId: string | null;
  candidateName: string;
  jobTitle: string;
  actorUserId: string | null;
}

/**
 * Emitted whenever an application's stage changes - both the hiring-manager
 * driven advance() path (screening/interview/offer/hired/rejected) and the
 * candidate-driven respondToOffer() path (offer accepted/declined). Shares
 * the same recipient shape as RecruitmentApplicationCreatedEvent
 * (hiringManagerUserId + tenant admins/HR managers) since both stage
 * transitions matter to whoever is tracking this candidate, not just
 * whoever triggered them. Consumed by a listener living in
 * notifications-feature — see RecruitmentApplicationCreatedEvent's doc
 * comment for why this event is a plain string/payload contract rather
 * than a shared type.
 */
export const RECRUITMENT_APPLICATION_STAGE_CHANGED_EVENT = 'recruitment.application.stage_changed';

export interface RecruitmentApplicationStageChangedEvent {
  tenantId: string;
  hiringManagerUserId: string | null;
  candidateName: string;
  jobTitle: string;
  stage: Application['stage'];
  actorUserId: string | null;
}

@Injectable()
export class ApplicationService {
  constructor(
    private readonly applications: ApplicationRepository,
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
    dto: CreateApplicationDto,
    actorId?: string,
  ): Promise<Application> {
    const existing = await this.applications.findByCandidateAndRequisition(
      tenantId,
      dto.candidateId,
      dto.requisitionId,
    );
    if (existing) {
      throw new ConflictException('This candidate has already applied to this requisition');
    }

    let application: Application;
    try {
      application = await this.applications.create(tenantId, {
        candidateId: dto.candidateId,
        requisitionId: dto.requisitionId,
        createdBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('Candidate or requisition not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('This candidate has already applied to this requisition');
        }
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'recruitment.application.created',
      resourceType: 'Application',
      resourceId: application.id,
    });

    await this.notifyOfNewApplication(tenantId, application.id, actorId);

    return application;
  }

  /**
   * Always emits, even when the requisition has no hiring manager - the
   * listener separately notifies tenant admins/HR managers regardless
   * (see RecruitmentApplicationCreatedEvent's doc comment).
   */
  private async notifyOfNewApplication(
    tenantId: string,
    applicationId: string,
    actorId?: string,
  ): Promise<void> {
    const application = await this.applications.findById(tenantId, applicationId);
    if (!application) {
      return;
    }

    const hiringManagerUserId = await this.resolveHiringManagerUserId(tenantId, application);
    const event: RecruitmentApplicationCreatedEvent = {
      tenantId,
      hiringManagerUserId,
      candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
      jobTitle: application.requisition.title,
      actorUserId: actorId ?? null,
    };
    this.eventEmitter.emit(RECRUITMENT_APPLICATION_CREATED_EVENT, event);
  }

  private async resolveHiringManagerUserId(
    tenantId: string,
    application: ApplicationWithRelations,
  ): Promise<string | null> {
    if (!application.requisition.hiringManagerId) {
      return null;
    }
    const manager = await this.employees.findById(tenantId, application.requisition.hiringManagerId);
    return manager?.userId ?? null;
  }

  /**
   * Takes the pre-transition application (candidate/requisition relations
   * don't change across a stage move) and the new stage explicitly, rather
   * than re-fetching - the caller already has both.
   */
  private async notifyOfStageChange(
    tenantId: string,
    application: ApplicationWithRelations,
    stage: Application['stage'],
    actorId?: string,
  ): Promise<void> {
    const hiringManagerUserId = await this.resolveHiringManagerUserId(tenantId, application);
    const event: RecruitmentApplicationStageChangedEvent = {
      tenantId,
      hiringManagerUserId,
      candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
      jobTitle: application.requisition.title,
      stage,
      actorUserId: actorId ?? null,
    };
    this.eventEmitter.emit(RECRUITMENT_APPLICATION_STAGE_CHANGED_EVENT, event);
  }

  async findById(tenantId: string, id: string): Promise<ApplicationWithRelations> {
    const application = await this.applications.findById(tenantId, id);
    if (!application) {
      throw new NotFoundException(`Application "${id}" not found`);
    }
    return application;
  }

  async findByIdForHiringManager(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<ApplicationWithRelations> {
    const application = await this.findById(tenantId, id);
    await this.assertIsHiringManager(tenantId, userId, application.requisitionId);
    return application;
  }

  list(
    tenantId: string,
    params: { candidateId?: string; requisitionId?: string; stage?: Application['stage'] } = {},
  ): Promise<ApplicationWithRelations[]> {
    return this.applications.list(tenantId, params);
  }

  /** Applications belonging to requisitions where the caller is the hiring manager. */
  async listForHiringManager(tenantId: string, userId: string): Promise<ApplicationWithRelations[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const requisitions = await this.requisitions.list(tenantId, { hiringManagerId: employeeId });
    if (requisitions.length === 0) {
      return [];
    }
    const perRequisition = await Promise.all(
      requisitions.map((requisition) =>
        this.applications.list(tenantId, { requisitionId: requisition.id }),
      ),
    );
    return perRequisition.flat();
  }

  async advance(
    tenantId: string,
    id: string,
    dto: AdvanceApplicationDto,
    actorId?: string,
  ): Promise<Application> {
    const application = await this.findById(tenantId, id);
    this.assertTransition(application.stage, dto.stage, dto.rejectionReason);

    const updated = await this.applications.update(tenantId, id, {
      stage: dto.stage,
      notes: dto.notes,
      rejectionReason: dto.stage === 'REJECTED' ? dto.rejectionReason : undefined,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'recruitment.application.stage_changed',
      resourceType: 'Application',
      resourceId: id,
      metadata: { from: application.stage, to: dto.stage },
    });

    await this.notifyOfStageChange(tenantId, application, dto.stage, actorId);

    return updated;
  }

  async advanceAsHiringManager(
    tenantId: string,
    userId: string,
    id: string,
    dto: AdvanceApplicationDto,
  ): Promise<Application> {
    const application = await this.findById(tenantId, id);
    await this.assertIsHiringManager(tenantId, userId, application.requisitionId);
    return this.advance(tenantId, id, dto, userId);
  }

  async sendOffer(
    tenantId: string,
    id: string,
    dto: SendOfferDto,
    actorId?: string,
  ): Promise<Application> {
    const application = await this.findById(tenantId, id);
    if (application.stage !== 'OFFER') {
      throw new ConflictException('Can only send an offer once the application is in the OFFER stage');
    }

    const updated = await this.applications.update(tenantId, id, {
      offeredSalary: dto.offeredSalary,
      offeredStartDate: new Date(dto.offeredStartDate),
      offerSentAt: new Date(),
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'recruitment.application.offer_sent',
      resourceType: 'Application',
      resourceId: id,
    });

    return updated;
  }

  async respondToOffer(
    tenantId: string,
    id: string,
    dto: RespondToOfferDto,
    actorId?: string,
  ): Promise<Application> {
    const application = await this.findById(tenantId, id);
    if (application.stage !== 'OFFER' || !application.offerSentAt) {
      throw new ConflictException('No pending offer to respond to');
    }

    const nextStage = dto.accepted ? 'HIRED' : 'REJECTED';
    this.assertTransition(application.stage, nextStage, dto.accepted ? undefined : 'Offer declined');

    const updated = await this.applications.update(tenantId, id, {
      offerAccepted: dto.accepted,
      offerRespondedAt: new Date(),
      stage: nextStage,
      rejectionReason: dto.accepted ? undefined : 'Offer declined',
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: dto.accepted
        ? 'recruitment.application.offer_accepted'
        : 'recruitment.application.offer_declined',
      resourceType: 'Application',
      resourceId: id,
    });

    await this.notifyOfStageChange(tenantId, application, nextStage, actorId);

    return updated;
  }

  async linkHiredEmployee(
    tenantId: string,
    id: string,
    dto: LinkHiredEmployeeDto,
    actorId?: string,
  ): Promise<Application> {
    const application = await this.findById(tenantId, id);
    if (application.stage !== 'HIRED') {
      throw new ConflictException('Can only link an employee once the application has reached HIRED');
    }

    let updated: Application;
    try {
      updated = await this.applications.update(tenantId, id, {
        hiredEmployeeId: dto.employeeId,
        updatedBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException(`Employee "${dto.employeeId}" not found`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'recruitment.application.hired_employee_linked',
      resourceType: 'Application',
      resourceId: id,
      metadata: { employeeId: dto.employeeId },
    });

    return updated;
  }

  private assertTransition(
    from: Application['stage'],
    to: Application['stage'],
    rejectionReason?: string,
  ): void {
    if (!canTransitionApplicationStage(from, to)) {
      throw new ConflictException(`Cannot move an application from ${from} to ${to}`);
    }
    if (to === 'REJECTED' && !rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting an application');
    }
  }

  private async assertIsHiringManager(
    tenantId: string,
    userId: string,
    requisitionId: string,
  ): Promise<void> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const requisition = await this.requisitions.findById(tenantId, requisitionId);
    if (!requisition || requisition.hiringManagerId !== employeeId) {
      throw new ForbiddenException('You are not the hiring manager for this requisition');
    }
  }
}
