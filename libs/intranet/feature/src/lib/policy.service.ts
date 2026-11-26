import { randomUUID } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Policy } from '@prisma/client';
import { isInAudience, validateAudience } from '@africahr/intranet-domain';
import {
  IntranetEmployeeRepository,
  PolicyAcknowledgementRepository,
  PolicyAudienceEmployee,
  PolicyRepository,
} from '@africahr/intranet-data-access';
import { AuditService } from '@africahr/platform-audit';
import { StorageService } from '@africahr/platform-storage';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { CreatePolicyResponseDto } from './dto/create-policy-response.dto';
import { PolicyAcknowledgementResponseDto } from './dto/policy-acknowledgement-response.dto';

export interface PolicyWithAcknowledgedFlag extends Policy {
  acknowledgedByMe?: boolean;
}

@Injectable()
export class PolicyService {
  constructor(
    private readonly policies: PolicyRepository,
    private readonly acknowledgements: PolicyAcknowledgementRepository,
    private readonly employees: IntranetEmployeeRepository,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, dto: CreatePolicyDto, actorId?: string): Promise<CreatePolicyResponseDto> {
    const audienceError = validateAudience({
      audienceScope: dto.audienceScope,
      organizationId: dto.organizationId ?? null,
      organizationUnitId: dto.organizationUnitId ?? null,
    });
    if (audienceError) {
      throw new BadRequestException(audienceError);
    }

    if (dto.organizationId) {
      const belongsToTenant = await this.policies.organizationExistsInTenant(tenantId, dto.organizationId);
      if (!belongsToTenant) {
        throw new NotFoundException(`Organization "${dto.organizationId}" not found`);
      }
    }
    if (dto.organizationUnitId) {
      const belongsToTenant = await this.policies.organizationUnitExistsInTenant(tenantId, dto.organizationUnitId);
      if (!belongsToTenant) {
        throw new NotFoundException(`Organization unit "${dto.organizationUnitId}" not found`);
      }
    }

    let version = 1;
    if (dto.supersedesId) {
      const previous = await this.policies.findById(tenantId, dto.supersedesId);
      if (!previous) {
        throw new NotFoundException(`Policy "${dto.supersedesId}" not found`);
      }
      version = previous.version + 1;
    }

    const storageKey = `policies/${tenantId}/${randomUUID()}-${dto.fileName}`;
    const uploadUrl = await this.storage.getUploadUrl(storageKey, dto.contentType);

    const policy = await this.policies.create({
      tenantId,
      title: dto.title,
      folder: dto.folder,
      storageKey,
      fileName: dto.fileName,
      version,
      supersedesId: dto.supersedesId,
      audienceScope: dto.audienceScope,
      organizationId: dto.organizationId,
      organizationUnitId: dto.organizationUnitId,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'intranet.policy_published',
      resourceType: 'Policy',
      resourceId: policy.id,
      metadata: { title: dto.title, audienceScope: dto.audienceScope, version },
    });

    return { uploadUrl, policyId: policy.id };
  }

  listAll(tenantId: string): Promise<Policy[]> {
    return this.policies.listAll(tenantId);
  }

  async getViewUrl(tenantId: string, id: string): Promise<string> {
    const policy = await this.policies.findById(tenantId, id);
    if (!policy) {
      throw new NotFoundException(`Policy "${id}" not found`);
    }
    return this.storage.getViewUrl(policy.storageKey);
  }

  async listAcknowledgements(tenantId: string, policyId: string): Promise<PolicyAcknowledgementResponseDto[]> {
    const policy = await this.policies.findById(tenantId, policyId);
    if (!policy) {
      throw new NotFoundException(`Policy "${policyId}" not found`);
    }
    const rows = await this.acknowledgements.listForPolicy(tenantId, policyId);
    return rows.map((row) => ({
      employeeId: row.employee.id,
      firstName: row.employee.firstName,
      lastName: row.employee.lastName,
      readAt: row.readAt.toISOString(),
    }));
  }

  async listForSelf(tenantId: string, userId: string): Promise<PolicyWithAcknowledgedFlag[]> {
    const employee = await this.requireEmployee(tenantId, userId);
    const audience: PolicyAudienceEmployee = {
      organizationId: employee.organizationId,
      organizationUnitId: employee.organizationUnitId,
    };
    const [visible, acknowledgedIds] = await Promise.all([
      this.policies.listVisibleTo(tenantId, audience),
      this.acknowledgements.listPolicyIdsAcknowledgedByEmployee(tenantId, employee.id),
    ]);
    const acknowledgedSet = new Set(acknowledgedIds);
    return visible.map((policy) => ({ ...policy, acknowledgedByMe: acknowledgedSet.has(policy.id) }));
  }

  async getViewUrlForSelf(tenantId: string, userId: string, policyId: string): Promise<string> {
    const employee = await this.requireEmployee(tenantId, userId);
    const policy = await this.requireVisiblePolicy(tenantId, policyId, employee);
    return this.storage.getViewUrl(policy.storageKey);
  }

  async acknowledge(tenantId: string, userId: string, policyId: string): Promise<void> {
    const employee = await this.requireEmployee(tenantId, userId);
    await this.requireVisiblePolicy(tenantId, policyId, employee);

    const existing = await this.acknowledgements.findOne(tenantId, policyId, employee.id);
    if (existing) {
      return;
    }
    await this.acknowledgements.create(tenantId, policyId, employee.id);
  }

  private async requireEmployee(tenantId: string, userId: string) {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record linked to this account');
    }
    return employee;
  }

  private async requireVisiblePolicy(
    tenantId: string,
    policyId: string,
    employee: PolicyAudienceEmployee,
  ): Promise<Policy> {
    const policy = await this.policies.findById(tenantId, policyId);
    if (!policy) {
      throw new NotFoundException(`Policy "${policyId}" not found`);
    }
    if (
      !isInAudience(
        {
          audienceScope: policy.audienceScope,
          organizationId: policy.organizationId,
          organizationUnitId: policy.organizationUnitId,
        },
        employee,
      )
    ) {
      throw new ForbiddenException('This policy is not visible to you');
    }
    return policy;
  }
}
