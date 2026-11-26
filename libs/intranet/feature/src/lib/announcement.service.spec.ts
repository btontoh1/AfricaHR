import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Announcement, AudienceScope } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { StorageService } from '@africahr/platform-storage';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import {
  AnnouncementReadRepository,
  AnnouncementRepository,
  IntranetEligibleEmployee,
  IntranetEmployeeRepository,
} from '@africahr/intranet-data-access';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

describe('AnnouncementService', () => {
  let service: AnnouncementService;
  let announcements: jest.Mocked<AnnouncementRepository>;
  let reads: jest.Mocked<AnnouncementReadRepository>;
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

  function makeActor(overrides: Partial<RequestUser> = {}): RequestUser {
    return {
      sub: 'actor-1',
      email: 'actor@test.com',
      role: SystemRole.TENANT_ADMIN,
      tenantId: 'tenant-1',
      organizationId: null,
      organizationUnitId: null,
      iat: 0,
      exp: 0,
      ...overrides,
    };
  }

  function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
    return {
      id: 'announcement-1',
      tenantId: 'tenant-1',
      title: 'Office closed Friday',
      body: 'The office will be closed.',
      attachmentKey: null,
      attachmentFileName: null,
      audienceScope: 'TENANT' as AudienceScope,
      organizationId: null,
      organizationUnitId: null,
      pinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: 'actor-1',
      updatedBy: 'actor-1',
      ...overrides,
    };
  }

  function makeDto(overrides: Partial<CreateAnnouncementDto> = {}): CreateAnnouncementDto {
    return {
      title: 'Office closed Friday',
      body: 'The office will be closed.',
      audienceScope: 'TENANT' as AudienceScope,
      ...overrides,
    };
  }

  beforeEach(() => {
    announcements = {
      create: jest.fn(),
      findById: jest.fn(),
      listAll: jest.fn(),
      setPinned: jest.fn(),
      listVisibleTo: jest.fn(),
      organizationExistsInTenant: jest.fn(),
      organizationUnitExistsInTenant: jest.fn(),
    } as unknown as jest.Mocked<AnnouncementRepository>;

    reads = {
      findOne: jest.fn(),
      create: jest.fn(),
      listAnnouncementIdsReadByEmployee: jest.fn(),
    } as unknown as jest.Mocked<AnnouncementReadRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IntranetEmployeeRepository>;

    storage = {
      getUploadUrl: jest.fn().mockResolvedValue('https://storage.example.com/upload'),
      getViewUrl: jest.fn().mockResolvedValue('https://storage.example.com/view'),
    } as unknown as jest.Mocked<StorageService>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new AnnouncementService(announcements, reads, employees, storage, audit);
  });

  describe('create', () => {
    it('rejects an inconsistent audience before touching storage or the repository', async () => {
      const dto = makeDto({ audienceScope: 'ORGANIZATION' as AudienceScope });

      await expect(service.create('tenant-1', dto, makeActor())).rejects.toThrow(BadRequestException);
      expect(storage.getUploadUrl).not.toHaveBeenCalled();
      expect(announcements.create).not.toHaveBeenCalled();
    });

    it('rejects a UNIT_ADMIN posting outside ORGANIZATION_UNIT scope', async () => {
      const actor = makeActor({ role: SystemRole.UNIT_ADMIN, organizationUnitId: 'unit-1' });
      const dto = makeDto({ audienceScope: 'TENANT' as AudienceScope });

      await expect(service.create('tenant-1', dto, actor)).rejects.toThrow(ForbiddenException);
      expect(announcements.create).not.toHaveBeenCalled();
    });

    it('rejects a UNIT_ADMIN posting to a different department', async () => {
      const actor = makeActor({ role: SystemRole.UNIT_ADMIN, organizationUnitId: 'unit-1' });
      const dto = makeDto({ audienceScope: 'ORGANIZATION_UNIT' as AudienceScope, organizationUnitId: 'unit-9' });
      announcements.organizationUnitExistsInTenant.mockResolvedValue(true);

      await expect(service.create('tenant-1', dto, actor)).rejects.toThrow(ForbiddenException);
      expect(announcements.create).not.toHaveBeenCalled();
    });

    it('allows a UNIT_ADMIN posting to their own department', async () => {
      const actor = makeActor({ role: SystemRole.UNIT_ADMIN, organizationUnitId: 'unit-1' });
      const dto = makeDto({ audienceScope: 'ORGANIZATION_UNIT' as AudienceScope, organizationUnitId: 'unit-1' });
      announcements.organizationUnitExistsInTenant.mockResolvedValue(true);
      announcements.create.mockResolvedValue(makeAnnouncement({ audienceScope: 'ORGANIZATION_UNIT' as AudienceScope, organizationUnitId: 'unit-1' }));

      const result = await service.create('tenant-1', dto, actor);

      expect(announcements.create).toHaveBeenCalledWith(
        expect.objectContaining({ audienceScope: 'ORGANIZATION_UNIT', organizationUnitId: 'unit-1' }),
      );
      expect(result.announcementId).toBe('announcement-1');
    });

    it('rejects an attachment file name without a content type', async () => {
      const dto = makeDto({ attachmentFileName: 'flyer.png' });

      await expect(service.create('tenant-1', dto, makeActor())).rejects.toThrow(BadRequestException);
    });

    it('mints a storage key and upload URL when an attachment is included', async () => {
      announcements.create.mockResolvedValue(makeAnnouncement());
      const dto = makeDto({ attachmentFileName: 'flyer.png', attachmentContentType: 'image/png' });

      const result = await service.create('tenant-1', dto, makeActor());

      expect(storage.getUploadUrl).toHaveBeenCalledWith(expect.stringContaining('announcements/tenant-1/'), 'image/png');
      expect(result.uploadUrl).toBe('https://storage.example.com/upload');
    });

    it('creates a post with no attachment and no upload URL', async () => {
      announcements.create.mockResolvedValue(makeAnnouncement());

      const result = await service.create('tenant-1', makeDto(), makeActor());

      expect(storage.getUploadUrl).not.toHaveBeenCalled();
      expect(result.uploadUrl).toBeUndefined();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'intranet.announcement_published', resourceId: 'announcement-1' }),
      );
    });
  });

  describe('setPinned', () => {
    it('rejects a UNIT_ADMIN pinning a post outside their department', async () => {
      announcements.findById.mockResolvedValue(makeAnnouncement({ organizationUnitId: 'unit-9' }));
      const actor = makeActor({ role: SystemRole.UNIT_ADMIN, organizationUnitId: 'unit-1' });

      await expect(service.setPinned('tenant-1', 'announcement-1', true, actor)).rejects.toThrow(ForbiddenException);
      expect(announcements.setPinned).not.toHaveBeenCalled();
    });

    it('allows a TENANT_ADMIN to pin any post', async () => {
      announcements.findById.mockResolvedValue(makeAnnouncement());
      announcements.setPinned.mockResolvedValue(makeAnnouncement({ pinned: true }));

      await service.setPinned('tenant-1', 'announcement-1', true, makeActor());

      expect(announcements.setPinned).toHaveBeenCalledWith('tenant-1', 'announcement-1', true, 'actor-1');
    });
  });

  describe('listForSelf', () => {
    it('rejects a caller with no linked employee record', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.listForSelf('tenant-1', 'user-9')).rejects.toThrow(ForbiddenException);
    });

    it('flags which visible posts the employee has already read', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      announcements.listVisibleTo.mockResolvedValue([
        makeAnnouncement({ id: 'announcement-1' }),
        makeAnnouncement({ id: 'announcement-2' }),
      ]);
      reads.listAnnouncementIdsReadByEmployee.mockResolvedValue(['announcement-1']);

      const result = await service.listForSelf('tenant-1', 'user-1');

      expect(announcements.listVisibleTo).toHaveBeenCalledWith('tenant-1', {
        organizationId: 'org-1',
        organizationUnitId: 'unit-1',
      });
      expect(result.find((a) => a.id === 'announcement-1')?.isRead).toBe(true);
      expect(result.find((a) => a.id === 'announcement-2')?.isRead).toBe(false);
    });
  });

  describe('markRead', () => {
    it('rejects a post outside the employee\'s audience', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      announcements.findById.mockResolvedValue(
        makeAnnouncement({ audienceScope: 'ORGANIZATION' as AudienceScope, organizationId: 'org-9' }),
      );

      await expect(service.markRead('tenant-1', 'user-1', 'announcement-1')).rejects.toThrow(ForbiddenException);
      expect(reads.create).not.toHaveBeenCalled();
    });

    it('is idempotent - marking read twice does not insert twice', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      announcements.findById.mockResolvedValue(makeAnnouncement());
      reads.findOne.mockResolvedValue({
        id: 'read-1',
        tenantId: 'tenant-1',
        announcementId: 'announcement-1',
        employeeId: 'employee-1',
        readAt: new Date(),
      });

      await service.markRead('tenant-1', 'user-1', 'announcement-1');

      expect(reads.create).not.toHaveBeenCalled();
    });

    it('creates the read row on first view', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      announcements.findById.mockResolvedValue(makeAnnouncement());
      reads.findOne.mockResolvedValue(null);

      await service.markRead('tenant-1', 'user-1', 'announcement-1');

      expect(reads.create).toHaveBeenCalledWith('tenant-1', 'announcement-1', 'employee-1');
    });
  });
});
