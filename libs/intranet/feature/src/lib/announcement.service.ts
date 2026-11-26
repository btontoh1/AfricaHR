import { randomUUID } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Announcement } from '@prisma/client';
import { isInAudience, validateAudience } from '@africahr/intranet-domain';
import {
  AnnouncementAudienceEmployee,
  AnnouncementReadRepository,
  AnnouncementRepository,
  IntranetEmployeeRepository,
} from '@africahr/intranet-data-access';
import { assertOrganizationUnitScope, RequestUser, SystemRole } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { StorageService } from '@africahr/platform-storage';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateAnnouncementResponseDto } from './dto/create-announcement-response.dto';

export interface AnnouncementWithReadFlag extends Announcement {
  isRead?: boolean;
}

@Injectable()
export class AnnouncementService {
  constructor(
    private readonly announcements: AnnouncementRepository,
    private readonly reads: AnnouncementReadRepository,
    private readonly employees: IntranetEmployeeRepository,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateAnnouncementDto, actor: RequestUser): Promise<CreateAnnouncementResponseDto> {
    // Department heads "post to their team" (project plan) - narrower than
    // the group-wide roles below, which may target any audience scope.
    if (actor.role === SystemRole.UNIT_ADMIN && dto.audienceScope !== 'ORGANIZATION_UNIT') {
      throw new ForbiddenException('Department heads may only post to their own department');
    }

    const audienceError = validateAudience({
      audienceScope: dto.audienceScope,
      organizationId: dto.organizationId ?? null,
      organizationUnitId: dto.organizationUnitId ?? null,
    });
    if (audienceError) {
      throw new BadRequestException(audienceError);
    }

    if (dto.audienceScope === 'ORGANIZATION_UNIT' && dto.organizationUnitId) {
      assertOrganizationUnitScope(actor, dto.organizationUnitId);
    }

    if ((dto.attachmentFileName && !dto.attachmentContentType) || (!dto.attachmentFileName && dto.attachmentContentType)) {
      throw new BadRequestException('attachmentFileName and attachmentContentType must be set together');
    }

    if (dto.organizationId) {
      const belongsToTenant = await this.announcements.organizationExistsInTenant(tenantId, dto.organizationId);
      if (!belongsToTenant) {
        throw new NotFoundException(`Organization "${dto.organizationId}" not found`);
      }
    }
    if (dto.organizationUnitId) {
      const belongsToTenant = await this.announcements.organizationUnitExistsInTenant(tenantId, dto.organizationUnitId);
      if (!belongsToTenant) {
        throw new NotFoundException(`Organization unit "${dto.organizationUnitId}" not found`);
      }
    }

    let attachmentKey: string | undefined;
    let uploadUrl: string | undefined;
    if (dto.attachmentFileName && dto.attachmentContentType) {
      attachmentKey = `announcements/${tenantId}/${randomUUID()}-${dto.attachmentFileName}`;
      uploadUrl = await this.storage.getUploadUrl(attachmentKey, dto.attachmentContentType);
    }

    const announcement = await this.announcements.create({
      tenantId,
      title: dto.title,
      body: dto.body,
      attachmentKey,
      attachmentFileName: dto.attachmentFileName,
      audienceScope: dto.audienceScope,
      organizationId: dto.organizationId,
      organizationUnitId: dto.organizationUnitId,
      pinned: dto.pinned,
      createdBy: actor.sub,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub,
      action: 'intranet.announcement_published',
      resourceType: 'Announcement',
      resourceId: announcement.id,
      metadata: { title: dto.title, audienceScope: dto.audienceScope },
    });

    return { announcementId: announcement.id, uploadUrl };
  }

  listAll(tenantId: string): Promise<Announcement[]> {
    return this.announcements.listAll(tenantId);
  }

  async setPinned(tenantId: string, id: string, pinned: boolean, actor: RequestUser): Promise<Announcement> {
    const announcement = await this.announcements.findById(tenantId, id);
    if (!announcement) {
      throw new NotFoundException(`Announcement "${id}" not found`);
    }
    // A department head may only pin/unpin their own team's posts - a null
    // organizationUnitId (TENANT/ORGANIZATION scope) correctly denies them
    // too, since assertOrganizationUnitScope compares against actor.organizationUnitId.
    assertOrganizationUnitScope(actor, announcement.organizationUnitId ?? '');

    const updated = await this.announcements.setPinned(tenantId, id, pinned, actor.sub);
    await this.audit.record({
      tenantId,
      actorUserId: actor.sub,
      action: pinned ? 'intranet.announcement_pinned' : 'intranet.announcement_unpinned',
      resourceType: 'Announcement',
      resourceId: id,
    });
    return updated;
  }

  async getAttachmentViewUrl(tenantId: string, id: string): Promise<string> {
    const announcement = await this.announcements.findById(tenantId, id);
    if (!announcement?.attachmentKey) {
      throw new NotFoundException(`Announcement "${id}" has no attachment`);
    }
    return this.storage.getViewUrl(announcement.attachmentKey);
  }

  async listForSelf(tenantId: string, userId: string): Promise<AnnouncementWithReadFlag[]> {
    const employee = await this.requireEmployee(tenantId, userId);
    const audience: AnnouncementAudienceEmployee = {
      organizationId: employee.organizationId,
      organizationUnitId: employee.organizationUnitId,
    };
    const [visible, readIds] = await Promise.all([
      this.announcements.listVisibleTo(tenantId, audience),
      this.reads.listAnnouncementIdsReadByEmployee(tenantId, employee.id),
    ]);
    const readSet = new Set(readIds);
    return visible.map((announcement) => ({ ...announcement, isRead: readSet.has(announcement.id) }));
  }

  async getAttachmentViewUrlForSelf(tenantId: string, userId: string, id: string): Promise<string> {
    const employee = await this.requireEmployee(tenantId, userId);
    const announcement = await this.requireVisibleAnnouncement(tenantId, id, employee);
    if (!announcement.attachmentKey) {
      throw new NotFoundException(`Announcement "${id}" has no attachment`);
    }
    return this.storage.getViewUrl(announcement.attachmentKey);
  }

  async markRead(tenantId: string, userId: string, id: string): Promise<void> {
    const employee = await this.requireEmployee(tenantId, userId);
    await this.requireVisibleAnnouncement(tenantId, id, employee);

    const existing = await this.reads.findOne(tenantId, id, employee.id);
    if (existing) {
      return;
    }
    await this.reads.create(tenantId, id, employee.id);
  }

  private async requireEmployee(tenantId: string, userId: string) {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record linked to this account');
    }
    return employee;
  }

  private async requireVisibleAnnouncement(
    tenantId: string,
    id: string,
    employee: AnnouncementAudienceEmployee,
  ): Promise<Announcement> {
    const announcement = await this.announcements.findById(tenantId, id);
    if (!announcement) {
      throw new NotFoundException(`Announcement "${id}" not found`);
    }
    if (
      !isInAudience(
        {
          audienceScope: announcement.audienceScope,
          organizationId: announcement.organizationId,
          organizationUnitId: announcement.organizationUnitId,
        },
        employee,
      )
    ) {
      throw new ForbiddenException('This announcement is not visible to you');
    }
    return announcement;
  }
}
