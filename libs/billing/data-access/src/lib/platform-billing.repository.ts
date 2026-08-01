import { Injectable } from '@nestjs/common';
import { InvoiceStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CrossTenantSubscription {
  id: string;
  tenantId: string;
  pricePerEmployee: number;
  currency: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  paystackCustomerCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrossTenantInvoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  employeeCountAtIssue: number;
  status: InvoiceStatus;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  paidAt: Date | null;
  paystackReference: string | null;
  checkoutUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RawSubscriptionRow {
  id: string;
  tenantId: string;
  pricePerEmployee: string;
  currency: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  paystackCustomerCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RawInvoiceRow {
  id: string;
  tenantId: string;
  subscriptionId: string;
  amount: string;
  currency: string;
  employeeCountAtIssue: number;
  status: InvoiceStatus;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  paidAt: Date | null;
  paystackReference: string | null;
  checkoutUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RawActiveEmployeeCountRow {
  tenantId: string;
  activeCount: string;
}

interface RawRevenueByCurrencyRow {
  currency: string;
  totalPaid: string;
}

/**
 * Platform-admin, cross-tenant billing reads (MRR, platform revenue,
 * expiring subscriptions, webhook invoice lookup). "subscriptions" and
 * "invoices" both have non-nullable tenant_id, so they use the plain
 * tenant_isolation RLS policy (RLS_CONVENTION.md §2) - unlike the
 * nullable-tenant §4 case, that policy has no platform-sentinel branch, so
 * withPlatformScope would silently return zero rows for every one of these
 * reads. Each method instead calls a narrow SECURITY DEFINER SQL function
 * (§5), the same pattern as OrganizationRepository.listPendingReview.
 */
@Injectable()
export class PlatformBillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAllSubscriptions(): Promise<CrossTenantSubscription[]> {
    const rows = await this.prisma.$queryRaw<
      RawSubscriptionRow[]
    >`SELECT * FROM platform_list_subscriptions()`;
    return rows.map((row) => ({ ...row, pricePerEmployee: Number(row.pricePerEmployee) }));
  }

  async listActiveEmployeeCounts(): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<
      RawActiveEmployeeCountRow[]
    >`SELECT * FROM platform_active_employee_counts()`;
    return new Map(rows.map((row) => [row.tenantId, Number(row.activeCount)]));
  }

  async getRevenueByCurrency(): Promise<{ currency: string; totalPaid: number }[]> {
    const rows = await this.prisma.$queryRaw<
      RawRevenueByCurrencyRow[]
    >`SELECT * FROM platform_invoice_revenue_by_currency()`;
    return rows.map((row) => ({ currency: row.currency, totalPaid: Number(row.totalPaid) }));
  }

  /**
   * "tenants" intentionally has no RLS policy (it's the platform-level
   * table tenant isolation exists to protect access *to*), so this is a
   * plain, unscoped query — no withTenantContext/withPlatformScope needed,
   * same posture as TenantRepository's own reads.
   */
  async listTenantNames(tenantIds: string[]): Promise<Map<string, string>> {
    if (tenantIds.length === 0) {
      return new Map();
    }
    const tenants = await this.prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true },
    });
    return new Map(tenants.map((tenant) => [tenant.id, tenant.name]));
  }

  async findInvoiceByPaystackReference(reference: string): Promise<CrossTenantInvoice | null> {
    const rows = await this.prisma.$queryRaw<
      RawInvoiceRow[]
    >`SELECT * FROM find_invoice_by_paystack_reference_across_tenants(${reference})`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return { ...row, amount: Number(row.amount) };
  }
}
