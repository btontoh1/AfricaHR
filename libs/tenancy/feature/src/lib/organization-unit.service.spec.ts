import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Organization, OrganizationUnit } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { OrganizationRepository, OrganizationUnitRepository } from '@africahr/tenancy-data-access';
import { OrganizationUnitService } from './organization-unit.service';

describe('OrganizationUnitService', () => {
  let service: OrganizationUnitService;
  let units: jest.Mocked<OrganizationUnitRepository>;
  let organizations: jest.Mocked<OrganizationRepository>;
  let audit: jest.Mocked<AuditService>;

  const organization = { id: 'org-1', tenantId: 'tenant-1' } as Organization;

  function makeUnit(overrides: Partial<OrganizationUnit>): OrganizationUnit {
    return {
      id: 'unit-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      parentId: null,
      name: 'Human Resources',
      code: 'HR',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    };
  }

  beforeEach(() => {
    units = {
      create: jest.fn(),
      findById: jest.fn(),
      listByOrganization: jest.fn(),
      updateParent: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<OrganizationUnitRepository>;

    organizations = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<OrganizationRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new OrganizationUnitService(units, organizations, audit);
  });

  describe('create', () => {
    it('throws NotFoundException when the organization does not exist', async () => {
      organizations.findById.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', { organizationId: 'org-1', name: 'HR', code: 'HR' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when parentId belongs to a different organization', async () => {
      organizations.findById.mockResolvedValue(organization);
      units.findById.mockResolvedValue(makeUnit({ id: 'unit-2', organizationId: 'org-2' }));

      await expect(
        service.create('tenant-1', {
          organizationId: 'org-1',
          parentId: 'unit-2',
          name: 'Payroll',
          code: 'PAY',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(units.create).not.toHaveBeenCalled();
    });

    it('creates a root unit when no parentId is given', async () => {
      organizations.findById.mockResolvedValue(organization);
      units.create.mockResolvedValue(makeUnit({}));

      await service.create('tenant-1', { organizationId: 'org-1', name: 'HR', code: 'HR' });

      expect(units.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ parentId: null }),
      );
    });
  });

  describe('updateParent', () => {
    it('throws NotFoundException when the unit does not exist', async () => {
      units.findById.mockResolvedValue(null);

      await expect(service.updateParent('tenant-1', 'missing', null)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects moving a unit under its own descendant (cycle)', async () => {
      const root = makeUnit({ id: 'root', parentId: null });
      const child = makeUnit({ id: 'child', parentId: 'root' });

      units.findById.mockImplementation((_tenantId, id) =>
        Promise.resolve(id === 'root' ? root : child),
      );
      units.listByOrganization.mockResolvedValue([root, child]);

      await expect(service.updateParent('tenant-1', 'root', 'child')).rejects.toThrow(
        BadRequestException,
      );
      expect(units.updateParent).not.toHaveBeenCalled();
    });

    it('allows a valid move', async () => {
      const a = makeUnit({ id: 'a', parentId: null });
      const b = makeUnit({ id: 'b', parentId: null });

      units.findById.mockImplementation((_tenantId, id) =>
        Promise.resolve(id === 'a' ? a : b),
      );
      units.listByOrganization.mockResolvedValue([a, b]);
      units.updateParent.mockResolvedValue(makeUnit({ id: 'b', parentId: 'a' }));

      await service.updateParent('tenant-1', 'b', 'a', 'ops-user-1');

      expect(units.updateParent).toHaveBeenCalledWith('tenant-1', 'b', 'a', 'ops-user-1');
    });
  });
});
