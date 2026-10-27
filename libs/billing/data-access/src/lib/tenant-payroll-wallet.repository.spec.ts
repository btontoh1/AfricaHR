import { PrismaService } from '@africahr/platform-database';
import { TenantPayrollWalletRepository } from './tenant-payroll-wallet.repository';

describe('TenantPayrollWalletRepository', () => {
  let repository: TenantPayrollWalletRepository;
  let tx: {
    tenantPayrollWallet: { findMany: jest.Mock; upsert: jest.Mock };
    tenantWalletTopUp: { create: jest.Mock; findMany: jest.Mock; update: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      tenantPayrollWallet: { findMany: jest.fn(), upsert: jest.fn() },
      tenantWalletTopUp: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new TenantPayrollWalletRepository(prisma as unknown as PrismaService);
  });

  it('lists a tenant balances ordered by currency', async () => {
    await repository.listBalances('tenant-1');

    expect(tx.tenantPayrollWallet.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { currency: 'asc' },
    });
  });

  it('upserts the wallet balance when crediting a top-up', async () => {
    await repository.creditBalance('tenant-1', 'GHS', 500);

    expect(tx.tenantPayrollWallet.upsert).toHaveBeenCalledWith({
      where: { tenantId_currency: { tenantId: 'tenant-1', currency: 'GHS' } },
      create: { tenantId: 'tenant-1', currency: 'GHS', balance: 500 },
      update: { balance: { increment: 500 } },
    });
  });

  it('creates a top-up record within the tenant context', async () => {
    tx.tenantWalletTopUp.create.mockResolvedValue({ id: 'topup-1' });

    const result = await repository.createTopUp({
      tenantId: 'tenant-1',
      currency: 'GHS',
      amount: 500,
      paystackReference: 'ref-1',
      checkoutUrl: 'https://paystack.com/ref-1',
      createdBy: 'admin-1',
    });

    expect(result).toEqual({ id: 'topup-1' });
    expect(tx.tenantWalletTopUp.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        currency: 'GHS',
        amount: 500,
        paystackReference: 'ref-1',
        checkoutUrl: 'https://paystack.com/ref-1',
        createdBy: 'admin-1',
        updatedBy: 'admin-1',
      },
    });
  });

  it('lists top-ups for a tenant newest first', async () => {
    await repository.listTopUpsForTenant('tenant-1');

    expect(tx.tenantWalletTopUp.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updates a top-up record', async () => {
    const paidAt = new Date('2026-10-27');

    await repository.updateTopUp('tenant-1', 'topup-1', { status: 'PAID', paidAt });

    expect(tx.tenantWalletTopUp.update).toHaveBeenCalledWith({
      where: { id: 'topup-1' },
      data: { status: 'PAID', paidAt },
    });
  });
});
