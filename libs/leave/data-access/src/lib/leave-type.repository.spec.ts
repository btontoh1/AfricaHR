import { PrismaService } from '@africahr/platform-database';
import { LeaveTypeRepository } from './leave-type.repository';

describe('LeaveTypeRepository', () => {
  let repository: LeaveTypeRepository;
  let tx: { leaveType: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      leaveType: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new LeaveTypeRepository(prisma as unknown as PrismaService);
  });

  it('creates a leave type within the tenant context, defaulting isPaid to true', async () => {
    await repository.create('tenant-1', {
      name: 'Annual Leave',
      code: 'ANNUAL',
      defaultEntitlementDays: 15,
      createdBy: 'hr-1',
    });

    expect(tx.leaveType.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        name: 'Annual Leave',
        code: 'ANNUAL',
        isPaid: true,
        defaultEntitlementDays: 15,
      }),
    });
  });

  it('lists only active types when activeOnly is set', async () => {
    await repository.list('tenant-1', { activeOnly: true });

    expect(tx.leaveType.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
    });
  });

  it('lists all types (active and inactive) when activeOnly is omitted', async () => {
    await repository.list('tenant-1');

    expect(tx.leaveType.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, isActive: undefined },
      orderBy: { name: 'asc' },
    });
  });
});
