import { Injectable } from '@nestjs/common';
import { PayslipDisbursementStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CrossTenantPayslipDisbursement {
  id: string;
  tenantId: string;
  disbursementStatus: PayslipDisbursementStatus;
}

interface RawPayslipDisbursementRow {
  id: string;
  tenantId: string;
  disbursementStatus: PayslipDisbursementStatus;
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
}
