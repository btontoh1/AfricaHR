import { PrismaService } from '@africahr/platform-database';
import { SubscriptionRepository } from './subscription.repository';

describe('SubscriptionRepository', () => {
  let repository: SubscriptionRepository;
  let tx: { subscription: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { subscription: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new SubscriptionRepository(prisma as unknown as PrismaService);
  });

  it('creates a subscription scoped to the tenant', async () => {
    tx.subscription.create.mockResolvedValue({ id: 'sub-1' });
    const start = new Date('2026-08-01');
    const end = new Date('2026-09-01');

    const result = await repository.create({
      tenantId: 'tenant-1',
      pricePerEmployee: 10,
      currency: 'GHS',
      currentPeriodStart: start,
      currentPeriodEnd: end,
      createdBy: 'admin-1',
    });

    expect(result).toEqual({ id: 'sub-1' });
    expect(tx.subscription.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        pricePerEmployee: 10,
        currency: 'GHS',
        currentPeriodStart: start,
        currentPeriodEnd: end,
        createdBy: 'admin-1',
        updatedBy: 'admin-1',
      },
    });
  });

  it('finds a subscription by tenant', async () => {
    tx.subscription.findUnique.mockResolvedValue({ id: 'sub-1' });

    const result = await repository.findByTenant('tenant-1');

    expect(result).toEqual({ id: 'sub-1' });
    expect(tx.subscription.findUnique).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
  });

  it('updates a subscription', async () => {
    tx.subscription.update.mockResolvedValue({ id: 'sub-1', status: 'CANCELLED' });

    const result = await repository.update('tenant-1', 'sub-1', { status: 'CANCELLED' });

    expect(result).toEqual({ id: 'sub-1', status: 'CANCELLED' });
    expect(tx.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { status: 'CANCELLED' },
    });
  });
});
