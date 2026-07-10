import { PrismaService } from '@africahr/platform-database';
import { NotificationRepository } from './notification.repository';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let tx: {
    notification: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      notification: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new NotificationRepository(prisma as unknown as PrismaService);
  });

  it('creates a notification within the tenant context', async () => {
    await repository.create('tenant-1', {
      userId: 'user-1',
      channel: 'IN_APP',
      subject: 'Leave approved',
      body: 'Your leave was approved.',
      status: 'SENT',
      sentAt: new Date('2026-01-01'),
      createdBy: 'hr-1',
    });

    expect(tx.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        channel: 'IN_APP',
        status: 'SENT',
      }),
    });
  });

  it('lists notifications filtered by userId', async () => {
    await repository.list('tenant-1', { userId: 'user-1' });

    expect(tx.notification.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, userId: 'user-1', status: undefined },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updates status and read state', async () => {
    const readAt = new Date('2026-01-02');
    await repository.update('tenant-1', 'notif-1', { isRead: true, readAt });

    expect(tx.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: expect.objectContaining({ isRead: true, readAt }),
    });
  });
});
