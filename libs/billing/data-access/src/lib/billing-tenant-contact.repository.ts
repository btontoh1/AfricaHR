import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

/**
 * Reads only the tenant admin's email, needed as the customer identity on
 * a Paystack checkout. scope:billing cannot import iam-feature/iam-data-access
 * (Nx module boundary), so this queries the shared "users" table directly
 * through PrismaService — same cross-bounded-context read pattern as
 * BillingEmployeeCountRepository.
 */
@Injectable()
export class BillingTenantContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminEmail(tenantId: string): Promise<string | null> {
    const admin = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.user.findFirst({
        where: { tenantId, role: 'TENANT_ADMIN', deletedAt: null, isActive: true },
        select: { email: true },
        orderBy: { createdAt: 'asc' },
      }),
    );
    return admin?.email ?? null;
  }
}
