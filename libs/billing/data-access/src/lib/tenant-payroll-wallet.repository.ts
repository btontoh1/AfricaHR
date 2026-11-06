import { Injectable } from '@nestjs/common';
import { TenantPayrollWallet, TenantWalletTopUp, WalletTopUpStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateTopUpInput {
  tenantId: string;
  currency: string;
  amount: number;
  paystackReference?: string;
  checkoutUrl?: string;
  createdBy?: string;
}

export interface UpdateTopUpInput {
  status?: WalletTopUpStatus;
  paidAt?: Date;
  updatedBy?: string;
}

/**
 * The billing-side half of the payroll wallet: balance reads and crediting
 * a top-up. scope:payroll gets its own small PayrollWalletRepository that
 * reads/debits the same tenant_payroll_wallets table directly through
 * PrismaService (Nx module boundary - same pattern as
 * TenantAddOnRepository/PayrollEmployeeRepository), since the two domains
 * cannot import each other's repository classes.
 */
@Injectable()
export class TenantPayrollWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  listBalances(tenantId: string): Promise<TenantPayrollWallet[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.tenantPayrollWallet.findMany({ where: { tenantId }, orderBy: { currency: 'asc' } }),
    );
  }

  /** Credits a real Paystack-verified top-up onto the tenant's balance for that currency — creating the wallet row the first time one is needed. */
  creditBalance(tenantId: string, currency: string, amount: number): Promise<TenantPayrollWallet> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.tenantPayrollWallet.upsert({
        where: { tenantId_currency: { tenantId, currency } },
        create: { tenantId, currency, balance: amount },
        update: { balance: { increment: amount } },
      }),
    );
  }

  createTopUp(input: CreateTopUpInput): Promise<TenantWalletTopUp> {
    return this.prisma.withTenantContext(input.tenantId, (tx) =>
      tx.tenantWalletTopUp.create({
        data: {
          tenantId: input.tenantId,
          currency: input.currency,
          amount: input.amount,
          paystackReference: input.paystackReference,
          checkoutUrl: input.checkoutUrl,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  listTopUpsForTenant(tenantId: string): Promise<TenantWalletTopUp[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.tenantWalletTopUp.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    );
  }

  updateTopUp(tenantId: string, id: string, input: UpdateTopUpInput): Promise<TenantWalletTopUp> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.tenantWalletTopUp.update({ where: { id }, data: input }),
    );
  }
}
