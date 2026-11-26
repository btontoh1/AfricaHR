import { Injectable } from '@nestjs/common';
import { WeeklyReportComment } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

@Injectable()
export class WeeklyReportCommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, weeklyReportId: string, authorId: string, body: string): Promise<WeeklyReportComment> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.weeklyReportComment.create({ data: { tenantId, weeklyReportId, authorId, body } }),
    );
  }

  listForReport(tenantId: string, weeklyReportId: string): Promise<WeeklyReportComment[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.weeklyReportComment.findMany({
        where: { tenantId, weeklyReportId },
        orderBy: { createdAt: 'asc' },
      }),
    );
  }
}
