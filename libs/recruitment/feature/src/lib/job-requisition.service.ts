import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JobRequisition, JobRequisitionStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { JobRequisitionRepository, RecruitmentEmployeeRepository } from '@africahr/recruitment-data-access';
import { CreateJobRequisitionDto } from './dto/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from './dto/update-job-requisition.dto';

@Injectable()
export class JobRequisitionService {
  constructor(
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

    return requisition;
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
    await this.findById(tenantId, id);

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
