import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyNotificationController } from './my-notification.controller';
import { NotificationService } from './notification.service';

describe('MyNotificationController', () => {
  let controller: MyNotificationController;
  let service: jest.Mocked<NotificationService>;

  const employee: RequestUser = {
    sub: 'user-1',
    email: 'kwame@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listForSelf: jest.fn(),
      markReadForSelf: jest.fn(),
      deleteForSelf: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    controller = new MyNotificationController(service);
  });

  it('lists the caller’s own notifications via their user id', () => {
    controller.list('tenant-1', employee);

    expect(service.listForSelf).toHaveBeenCalledWith('tenant-1', 'user-1');
  });

  it('marks a notification read, delegating the ownership check to the service', () => {
    controller.markRead('tenant-1', 'notif-1', employee);

    expect(service.markReadForSelf).toHaveBeenCalledWith('tenant-1', 'user-1', 'notif-1');
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', employee)).toThrow(ForbiddenException);
  });

  it('deletes a notification, delegating the ownership check to the service', () => {
    controller.delete('tenant-1', 'notif-1', employee);

    expect(service.deleteForSelf).toHaveBeenCalledWith('tenant-1', 'user-1', 'notif-1');
  });
});
