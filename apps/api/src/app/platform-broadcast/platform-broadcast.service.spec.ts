import { NotificationChannel, SystemRole } from '@prisma/client';
import { ActiveTenantAdmin, UserRepository } from '@africahr/iam-data-access';
import { NotificationService } from '@africahr/notifications-feature';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser } from '@africahr/platform-auth';
import { PlatformBroadcastService } from './platform-broadcast.service';

describe('PlatformBroadcastService', () => {
  let service: PlatformBroadcastService;
  let users: jest.Mocked<UserRepository>;
  let notifications: jest.Mocked<NotificationService>;
  let audit: jest.Mocked<AuditService>;

  const actor: RequestUser = {
    sub: 'platform-admin-1',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  const admins: ActiveTenantAdmin[] = [
    { id: 'admin-1', tenantId: 'tenant-1', email: 'admin1@tenant1.com', firstName: 'Ama', lastName: 'Owusu' },
    { id: 'admin-2', tenantId: 'tenant-2', email: 'admin2@tenant2.com', firstName: 'Kwame', lastName: 'Boateng' },
  ];

  beforeEach(() => {
    users = { findActiveTenantAdmins: jest.fn() } as unknown as jest.Mocked<UserRepository>;
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    audit = { record: jest.fn() } as unknown as jest.Mocked<AuditService>;

    service = new PlatformBroadcastService(users, notifications, audit);
  });

  it('sends an email and an in-app notice to every active tenant admin', async () => {
    users.findActiveTenantAdmins.mockResolvedValue(admins);

    const result = await service.broadcastToTenantAdmins('New Terms', 'We updated our Terms', actor);

    expect(notifications.send).toHaveBeenCalledTimes(4);
    expect(notifications.send).toHaveBeenCalledWith(
      'tenant-1',
      { userId: 'admin-1', channel: NotificationChannel.EMAIL, subject: 'New Terms', body: 'We updated our Terms' },
      'platform-admin-1',
    );
    expect(notifications.send).toHaveBeenCalledWith(
      'tenant-1',
      { userId: 'admin-1', channel: NotificationChannel.IN_APP, subject: 'New Terms', body: 'We updated our Terms' },
      'platform-admin-1',
    );
    expect(notifications.send).toHaveBeenCalledWith(
      'tenant-2',
      { userId: 'admin-2', channel: NotificationChannel.EMAIL, subject: 'New Terms', body: 'We updated our Terms' },
      'platform-admin-1',
    );
    expect(result).toEqual({ recipientCount: 2, failureCount: 0 });
  });

  it('records the broadcast on the platform-level audit log, attributed to the triggering admin', async () => {
    users.findActiveTenantAdmins.mockResolvedValue(admins);

    await service.broadcastToTenantAdmins('New Terms', 'We updated our Terms', actor);

    expect(audit.record).toHaveBeenCalledWith({
      tenantId: null,
      actorUserId: 'platform-admin-1',
      action: 'platform.notification_broadcast_sent',
      resourceType: 'Tenant',
      metadata: { subject: 'New Terms', recipientCount: 2, failureCount: 0 },
    });
  });

  it('keeps delivering to other tenants when one tenant fails, and counts the failure', async () => {
    users.findActiveTenantAdmins.mockResolvedValue(admins);
    notifications.send
      .mockRejectedValueOnce(new Error('SendGrid down'))
      .mockResolvedValueOnce(undefined as never)
      .mockResolvedValueOnce(undefined as never)
      .mockResolvedValueOnce(undefined as never);

    const result = await service.broadcastToTenantAdmins('New Terms', 'We updated our Terms', actor);

    expect(notifications.send).toHaveBeenCalledTimes(4);
    expect(result).toEqual({ recipientCount: 2, failureCount: 1 });
  });

  it('returns zero recipients without sending anything when no tenant has an active admin', async () => {
    users.findActiveTenantAdmins.mockResolvedValue([]);

    const result = await service.broadcastToTenantAdmins('New Terms', 'We updated our Terms', actor);

    expect(notifications.send).not.toHaveBeenCalled();
    expect(result).toEqual({ recipientCount: 0, failureCount: 0 });
  });
});
