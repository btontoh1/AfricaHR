import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AudienceScope, Policy } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { StorageService } from '@africahr/platform-storage';
import {
  IntranetEligibleEmployee,
  IntranetEmployeeRepository,
  PolicyAcknowledgementRepository,
  PolicyRepository,
} from '@africahr/intranet-data-access';
import { PolicyService } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';

describe('PolicyService', () => {
  let service: PolicyService;
  let policies: jest.Mocked<PolicyRepository>;
  let acknowledgements: jest.Mocked<PolicyAcknowledgementRepository>;
  let employees: jest.Mocked<IntranetEmployeeRepository>;
  let storage: jest.Mocked<StorageService>;
  let audit: jest.Mocked<AuditService>;

  const employee: IntranetEligibleEmployee = {
    id: 'employee-1',
    userId: 'user-1',
    organizationId: 'org-1',
    organizationUnitId: 'unit-1',
    firstName: 'Ama',
    lastName: 'Owusu',
  };

  function makePolicy(overrides: Partial<Policy> = {}): Policy {
    return {
      id: 'policy-1',
      tenantId: 'tenant-1',
      title: 'Leave Policy',
      folder: 'Leave',
      storageKey: 'policies/tenant-1/leave.pdf',
      fileName: 'leave.pdf',
      version: 1,
      supersedesId: null,
      audienceScope: 'TENANT' as AudienceScope,
      organizationId: null,
      organizationUnitId: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: 'actor-1',
      updatedBy: 'actor-1',
      ...overrides,
    };
  }

  function makeDto(overrides: Partial<CreatePolicyDto> = {}): CreatePolicyDto {
    return {
      title: 'Leave Policy',
      folder: 'Leave',
      fileName: 'leave.pdf',
      contentType: 'application/pdf',
      audienceScope: 'TENANT' as AudienceScope,
      ...overrides,
    };
  }

  beforeEach(() => {
    policies = {
      create: jest.fn(),
      findById: jest.fn(),
      listAll: jest.fn(),
      listVisibleTo: jest.fn(),
      organizationExistsInTenant: jest.fn(),
      organizationUnitExistsInTenant: jest.fn(),
    } as unknown as jest.Mocked<PolicyRepository>;

    acknowledgements = {
      findOne: jest.fn(),
      create: jest.fn(),
      listForPolicy: jest.fn(),
      listPolicyIdsAcknowledgedByEmployee: jest.fn(),
    } as unknown as jest.Mocked<PolicyAcknowledgementRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IntranetEmployeeRepository>;

    storage = {
      getUploadUrl: jest.fn().mockResolvedValue('https://storage.example.com/upload'),
      getViewUrl: jest.fn().mockResolvedValue('https://storage.example.com/view'),
    } as unknown as jest.Mocked<StorageService>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new PolicyService(policies, acknowledgements, employees, storage, audit);
  });

  describe('create', () => {
    it('rejects an inconsistent audience before touching storage or the repository', async () => {
      const dto = makeDto({ audienceScope: 'ORGANIZATION' as AudienceScope });

      await expect(service.create('tenant-1', dto, 'actor-1')).rejects.toThrow(BadRequestException);
      expect(storage.getUploadUrl).not.toHaveBeenCalled();
      expect(policies.create).not.toHaveBeenCalled();
    });

    it('rejects an organizationId that does not belong to the tenant', async () => {
      policies.organizationExistsInTenant.mockResolvedValue(false);
      const dto = makeDto({ audienceScope: 'ORGANIZATION' as AudienceScope, organizationId: 'org-9' });

      await expect(service.create('tenant-1', dto, 'actor-1')).rejects.toThrow(NotFoundException);
    });

    it('mints a storage key, uploads URL, and creates version 1 with no supersedesId', async () => {
      policies.create.mockResolvedValue(makePolicy());

      const result = await service.create('tenant-1', makeDto(), 'actor-1');

      expect(storage.getUploadUrl).toHaveBeenCalledWith(expect.stringContaining('policies/tenant-1/'), 'application/pdf');
      expect(policies.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', version: 1, supersedesId: undefined }),
      );
      expect(result).toEqual({ uploadUrl: 'https://storage.example.com/upload', policyId: 'policy-1' });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'intranet.policy_published', resourceId: 'policy-1' }),
      );
    });

    it('bumps the version and links supersedesId when replacing an earlier policy', async () => {
      policies.findById.mockResolvedValue(makePolicy({ id: 'policy-old', version: 2 }));
      policies.create.mockResolvedValue(makePolicy({ id: 'policy-new', version: 3, supersedesId: 'policy-old' }));

      await service.create('tenant-1', makeDto({ supersedesId: 'policy-old' }), 'actor-1');

      expect(policies.create).toHaveBeenCalledWith(expect.objectContaining({ version: 3, supersedesId: 'policy-old' }));
    });

    it('throws when supersedesId does not resolve to a real policy', async () => {
      policies.findById.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', makeDto({ supersedesId: 'missing' }), 'actor-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listForSelf', () => {
    it('rejects a caller with no linked employee record', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.listForSelf('tenant-1', 'user-9')).rejects.toThrow(ForbiddenException);
    });

    it('flags which visible policies the employee has already acknowledged', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      policies.listVisibleTo.mockResolvedValue([makePolicy({ id: 'policy-1' }), makePolicy({ id: 'policy-2' })]);
      acknowledgements.listPolicyIdsAcknowledgedByEmployee.mockResolvedValue(['policy-1']);

      const result = await service.listForSelf('tenant-1', 'user-1');

      expect(policies.listVisibleTo).toHaveBeenCalledWith('tenant-1', {
        organizationId: 'org-1',
        organizationUnitId: 'unit-1',
      });
      expect(result.find((p) => p.id === 'policy-1')?.acknowledgedByMe).toBe(true);
      expect(result.find((p) => p.id === 'policy-2')?.acknowledgedByMe).toBe(false);
    });
  });

  describe('acknowledge', () => {
    it('rejects a policy outside the employee\'s audience', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      policies.findById.mockResolvedValue(
        makePolicy({ audienceScope: 'ORGANIZATION' as AudienceScope, organizationId: 'org-9' }),
      );

      await expect(service.acknowledge('tenant-1', 'user-1', 'policy-1')).rejects.toThrow(ForbiddenException);
      expect(acknowledgements.create).not.toHaveBeenCalled();
    });

    it('is idempotent - acknowledging twice does not insert twice', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      policies.findById.mockResolvedValue(makePolicy());
      acknowledgements.findOne.mockResolvedValue({
        id: 'ack-1',
        tenantId: 'tenant-1',
        policyId: 'policy-1',
        employeeId: 'employee-1',
        readAt: new Date(),
      });

      await service.acknowledge('tenant-1', 'user-1', 'policy-1');

      expect(acknowledgements.create).not.toHaveBeenCalled();
    });

    it('creates the acknowledgement on first read', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      policies.findById.mockResolvedValue(makePolicy());
      acknowledgements.findOne.mockResolvedValue(null);

      await service.acknowledge('tenant-1', 'user-1', 'policy-1');

      expect(acknowledgements.create).toHaveBeenCalledWith('tenant-1', 'policy-1', 'employee-1');
    });
  });
});
