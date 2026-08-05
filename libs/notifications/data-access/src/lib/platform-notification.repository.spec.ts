import { PrismaService } from '@africahr/platform-database';
import { PlatformNotificationRepository } from './platform-notification.repository';

describe('PlatformNotificationRepository', () => {
  let repository: PlatformNotificationRepository;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    repository = new PlatformNotificationRepository(prisma as unknown as PrismaService);
  });

  describe('getDeliveryCounts', () => {
    it('parses counts to numbers across all tenants', async () => {
      prisma.$queryRaw.mockResolvedValue([{ sent: '120', failed: '3', pending: '1' }]);

      const result = await repository.getDeliveryCounts();

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual({ sent: 120, failed: 3, pending: 1 });
    });

    it('returns zeros when there are no EMAIL notifications at all', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await expect(repository.getDeliveryCounts()).resolves.toEqual({ sent: 0, failed: 0, pending: 0 });
    });
  });

  describe('listFailedNotifications', () => {
    it('lists failed notifications across tenants via the SECURITY DEFINER function', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          id: 'notif-1',
          tenantId: 'tenant-1',
          tenantName: 'Acme Ghana Ltd',
          userId: 'user-1',
          userEmail: 'ama@acme-ghana.com',
          userFirstName: 'Ama',
          userLastName: 'Owusu',
          subject: 'Your leave request was approved',
          failureReason: 'SendGrid: invalid recipient',
          createdAt: new Date('2026-08-01T00:00:00Z'),
        },
      ]);

      const result = await repository.listFailedNotifications(20);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual([expect.objectContaining({ id: 'notif-1', tenantName: 'Acme Ghana Ltd' })]);
    });

    it('returns an empty list when nothing failed', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await expect(repository.listFailedNotifications(20)).resolves.toEqual([]);
    });
  });
});
