import { Injectable } from '@nestjs/common';
import { PayslipDisbursementStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CrossTenantPayslipDisbursement {
  id: string;
  tenantId: string;
  disbursementStatus: PayslipDisbursementStatus;
}

export interface StalePendingDisbursement {
  id: string;
  tenantId: string;
  paystackTransferReference: string;
}

export interface DisbursementNeedingAttention {
  id: string;
  tenantId: string;
  tenantName: string | null;
  employeeId: string;
  employeeFirstName: string;
  employeeLastName: string;
  payRunId: string;
  periodStart: Date;
  periodEnd: Date;
  currency: string;
  netPay: number;
  disbursementStatus: PayslipDisbursementStatus;
  paystackTransferReference: string | null;
  updatedAt: Date;
}

interface RawPayslipDisbursementRow {
  id: string;
  tenantId: string;
  disbursementStatus: PayslipDisbursementStatus;
}

interface RawStalePendingDisbursementRow {
  id: string;
  tenantId: string;
  paystackTransferReference: string;
}

interface RawDisbursementNeedingAttentionRow extends Omit<DisbursementNeedingAttention, 'netPay'> {
  netPay: string;
}

/**
 * The Paystack transfer webhook (see PayrollTransferWebhookListener)
 * identifies a payslip only by its transfer reference, with no tenant
 * context attached to the payload - same "resolve before any tenant is
 * known" shape as PlatformBillingRepository.findInvoiceByPaystackReference,
 * applied to payslips. Uses a narrow SECURITY DEFINER SQL function
 * (find_payslip_by_paystack_transfer_reference_across_tenants) since
 * "payslips" has a non-nullable tenant_id and therefore no
 * platform-scope RLS branch - see that migration's comment.
 */
@Injectable()
export class PayrollDisbursementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPayslipByPaystackTransferReference(
    reference: string,
  ): Promise<CrossTenantPayslipDisbursement | null> {
    const rows = await this.prisma.$queryRaw<
      RawPayslipDisbursementRow[]
    >`SELECT * FROM find_payslip_by_paystack_transfer_reference_across_tenants(${reference})`;
    return rows[0] ?? null;
  }

  /** Every payslip still PENDING as of before olderThan, across every tenant - see the reconciliation sweep's own SECURITY DEFINER function for why this can't be a tenant-scoped read. */
  listStalePendingDisbursements(olderThan: Date): Promise<StalePendingDisbursement[]> {
    return this.prisma.$queryRaw<
      RawStalePendingDisbursementRow[]
    >`SELECT * FROM find_stale_pending_payslip_disbursements(${olderThan})`;
  }

  /**
   * Every payslip disbursement needing a human's attention across every
   * tenant - FAILED (any age) plus PENDING older than
   * stalePendingBefore - joined with tenant/employee/pay-run context for
   * the platform-admin dashboard. Same cross-tenant SECURITY DEFINER
   * reasoning as listStalePendingDisbursements.
   */
  async listDisbursementsNeedingAttention(stalePendingBefore: Date): Promise<DisbursementNeedingAttention[]> {
    const rows = await this.prisma.$queryRaw<
      RawDisbursementNeedingAttentionRow[]
    >`SELECT * FROM platform_list_disbursements_needing_attention(${stalePendingBefore})`;
    return rows.map((row) => ({ ...row, netPay: Number(row.netPay) }));
  }
}
