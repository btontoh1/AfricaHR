import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class ApplicationService {
  constructor(
    private readonly applications: ApplicationRepository,
    private readonly requisitions: JobRequisitionRepository,
    private readonly employees: RecruitmentEmployeeRepository,
    private readonly audit: AuditService,
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

    return application;
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
