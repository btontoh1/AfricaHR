import { PrismaService } from '@africahr/platform-database';
import { PayRunRepository } from './pay-run.repository';

describe('PayRunRepository', () => {
  let repository: PayRunRepository;
  let tx: {
    payRun: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findFirstOrThrow: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      payRun: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayRunRepository(prisma as unknown as PrismaService);
  });

  it('creates a pay run within the tenant context', async () => {
    const periodStart = new Date('2026-01-01');
    const periodEnd = new Date('2026-01-31');
    const payDate = new Date('2026-02-01');

    await repository.create('tenant-1', {
      organizationId: 'org-1',
      periodStart,
      periodEnd,
      payDate,
      createdBy: 'hr-1',
    });

    expect(tx.payRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        periodStart,
        periodEnd,
        payDate,
      }),
    });
  });

  it('finds many pay runs by id, scoped to the tenant', async () => {
    await repository.findManyByIds('tenant-1', ['run-1', 'run-2']);

    expect(tx.payRun.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', id: { in: ['run-1', 'run-2'] }, deletedAt: null },
    });
  });

  it('lists pay runs scoped to the tenant, most recent period first', async () => {
    await repository.list('tenant-1', { organizationId: 'org-1' });

    expect(tx.payRun.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, organizationId: 'org-1' },
      orderBy: { periodStart: 'desc' },
    });
  });

  it('updates status along with lifecycle timestamps when the pay run is still in fromStatus', async () => {
    const approvedAt = new Date('2026-02-01');
    tx.payRun.updateMany.mockResolvedValue({ count: 1 });
    tx.payRun.findFirstOrThrow.mockResolvedValue({ id: 'run-1', status: 'APPROVED' });

    const result = await repository.updateStatus('tenant-1', 'run-1', {
      fromStatus: 'PROCESSING',
      status: 'APPROVED',
      approvedAt,
      approvedBy: 'mgr-1',
      updatedBy: 'mgr-1',
    });

    expect(tx.payRun.updateMany).toHaveBeenCalledWith({
      where: { id: 'run-1', tenantId: 'tenant-1', status: 'PROCESSING' },
      data: {
        status: 'APPROVED',
        approvedAt,
        approvedBy: 'mgr-1',
        paidAt: undefined,
        updatedBy: 'mgr-1',
      },
    });
    expect(result).toEqual({ id: 'run-1', status: 'APPROVED' });
  });

  it('returns null without re-reading when the pay run already left fromStatus (lost the race)', async () => {
    tx.payRun.updateMany.mockResolvedValue({ count: 0 });

    const result = await repository.updateStatus('tenant-1', 'run-1', {
      fromStatus: 'PROCESSING',
      status: 'APPROVED',
      updatedBy: 'mgr-1',
    });

    expect(result).toBeNull();
    expect(tx.payRun.findFirstOrThrow).not.toHaveBeenCalled();
  });
});
