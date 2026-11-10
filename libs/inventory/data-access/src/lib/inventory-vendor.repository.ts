import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface InventoryVendorSummary {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
}

/**
 * Read-only: procurement orders against the existing AP Vendor (see Phase
 * 1's decision not to duplicate it as a separate "supplier" table).
 * scope:inventory cannot import ap-data-access's VendorRepository (Nx
 * module boundary), so this queries the shared "vendors" table directly -
 * same cross-module-read pattern as InventoryEmployeeRepository.
 */
@Injectable()
export class InventoryVendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<InventoryVendorSummary | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendor.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, organizationId: true, name: true, email: true, phone: true },
      }),
    );
  }

  list(tenantId: string, organizationId?: string): Promise<InventoryVendorSummary[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendor.findMany({
        where: { tenantId, organizationId, deletedAt: null },
        select: { id: true, organizationId: true, name: true, email: true, phone: true },
        orderBy: { name: 'asc' },
      }),
    );
  }
}
