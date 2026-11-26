import { Injectable } from '@nestjs/common';
import { AnnouncementRead } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

@Injectable()
export class AnnouncementReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOne(tenantId: string, announcementId: string, employeeId: string): Promise<AnnouncementRead | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.announcementRead.findFirst({ where: { tenantId, announcementId, employeeId } }),
    );
  }

  /**
   * Idempotent: viewing an already-read announcement again is a no-op, not
   * an error - same reasoning as PolicyAcknowledgementRepository.create.
   */
  create(tenantId: string, announcementId: string, employeeId: string): Promise<AnnouncementRead> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.announcementRead.create({ data: { tenantId, announcementId, employeeId } }),
    );
  }

  async listAnnouncementIdsReadByEmployee(tenantId: string, employeeId: string): Promise<string[]> {
    const rows = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.announcementRead.findMany({ where: { tenantId, employeeId }, select: { announcementId: true } }),
    );
    return rows.map((row) => row.announcementId);
  }
}
