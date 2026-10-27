import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface WalletRequirement {
  currency: string;
  amount: number;
}

export interface WalletShortfall {
  currency: string;
  required: number;
  available: number;
}

/** Thrown by reserveForDisbursement when one or more currencies don't have enough balance — the whole reservation is rolled back (see that method's doc comment). */
export class InsufficientWalletBalanceError extends Error {
  constructor(public readonly shortfalls: WalletShortfall[]) {
    super('Insufficient payroll wallet balance');
  }
}

/**
 * Reads/debits/credits the tenant's prefunded payroll balance (see
 * TenantPayrollWallet's own doc comment on platform-database's schema).
 * scope:payroll cannot import billing-data-access's
 * TenantPayrollWalletRepository (Nx module boundary), so this queries the
 * same shared "tenant_payroll_wallets" table directly through
 * PrismaService instead — same pattern as PayrollEmployeeRepository
 * reading the shared "employees" table.
 */
@Injectable()
export class PayrollWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBalances(tenantId: string): Promise<{ currency: string; balance: number }[]> {
    const wallets = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.tenantPayrollWallet.findMany({ where: { tenantId } }),
    );
    return wallets.map((wallet) => ({ currency: wallet.currency, balance: Number(wallet.balance) }));
  }

  /**
   * Reserves (debits) the full amount required for a disbursement run, in
   * every currency it needs, as a single all-or-nothing unit: all the
   * debits happen inside one withTenantContext transaction, and throwing
   * InsufficientWalletBalanceError partway through rolls every debit in
   * this call back, so a tenant short in one currency is never left
   * partially charged in another. Called once per markPaid()/
   * retryDisbursement() before any Paystack transfer is attempted - see
   * PayRunService.
   */
  async reserveForDisbursement(tenantId: string, requirements: WalletRequirement[]): Promise<void> {
    const positive = requirements.filter((requirement) => requirement.amount > 0);
    if (positive.length === 0) {
      return;
    }

    await this.prisma.withTenantContext(tenantId, async (tx) => {
      const shortfalls: WalletShortfall[] = [];

      for (const { currency, amount } of positive) {
        const result = await tx.tenantPayrollWallet.updateMany({
          where: { tenantId, currency, balance: { gte: amount } },
          data: { balance: { decrement: amount } },
        });

        if (result.count === 0) {
          const wallet = await tx.tenantPayrollWallet.findFirst({ where: { tenantId, currency } });
          shortfalls.push({ currency, required: amount, available: wallet ? Number(wallet.balance) : 0 });
        }
      }

      if (shortfalls.length > 0) {
        throw new InsufficientWalletBalanceError(shortfalls);
      }
    });
  }

  /** Returns a reserved-but-never-sent amount to the wallet (a skipped employee, a failed recipient creation, or a transfer that resolved to FAILED - see PayRunService.disburse and PayrollTransferWebhookListener). */
  async refund(tenantId: string, currency: string, amount: number): Promise<void> {
    if (amount <= 0) {
      return;
    }
    await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.tenantPayrollWallet.upsert({
        where: { tenantId_currency: { tenantId, currency } },
        create: { tenantId, currency, balance: amount },
        update: { balance: { increment: amount } },
      }),
    );
  }
}
