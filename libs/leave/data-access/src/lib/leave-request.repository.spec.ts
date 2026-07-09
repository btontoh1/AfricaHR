import { PrismaService } from '@africahr/platform-database';
import { LeaveRequestRepository } from './leave-request.repository';

describe('LeaveRequestRepository', () => {
  let repository: LeaveRequestRepository;
  let tx: { leaveRequest: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      leaveRequest: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new LeaveRequestRepository(prisma as unknown as PrismaService);
  });

  it('creates a leave request within the tenant context', async () => {
    const startDate = new Date('2026-02-02');
    const endDate = new Date('2026-02-06');

    await repository.create('tenant-1', {
      employeeId: 'emp-1',
      leaveTypeId: 'lt-1',
      startDate,
      endDate,
      daysRequested: 5,
      reason: 'Vacation',
      createdBy: 'emp-1-user',
    });

    expect(tx.leaveRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate,
        endDate,
        daysRequested: 5,
      }),
    });
  });

  it('lists requests filtered by employeeId and status', async () => {
    await repository.list('tenant-1', { employeeId: 'emp-1', status: 'PENDING' });

    expect(tx.leaveRequest.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, employeeId: 'emp-1', status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updates status along with approval metadata', async () => {
    const approvedAt = new Date('2026-01-15');

    await repository.updateStatus('tenant-1', 'req-1', {
      status: 'APPROVED',
      approverUserId: 'mgr-1',
      approvedAt,
      updatedBy: 'mgr-1',
    });

    expect(tx.leaveRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: {
        status: 'APPROVED',
        approverUserId: 'mgr-1',
        approvedAt,
        rejectionReason: undefined,
        updatedBy: 'mgr-1',
      },
    });
  });
});
