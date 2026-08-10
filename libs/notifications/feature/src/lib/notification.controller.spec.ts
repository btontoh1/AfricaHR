import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: jest.Mocked<NotificationService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      findById: jest.fn(),
      send: jest.fn(),
      sendFromTemplate: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    controller = new NotificationController(service);
  });

  it('lists with userId/status filters within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'user-1', 'SENT');

    expect(service.list).toHaveBeenCalledWith('tenant-1', { userId: 'user-1', status: 'SENT' });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'notif-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates send with tenant, dto, and actor', () => {
    const dto = { userId: 'user-1', channel: 'IN_APP', subject: 'Hi', body: 'Body' } as never;

    controller.send('tenant-1', dto, hrManager);

    expect(service.send).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('delegates sendFromTemplate with tenant, dto, and actor', () => {
    const dto = { userId: 'user-1', templateId: 'tmpl-1' };

    controller.sendFromTemplate('tenant-1', dto, hrManager);

    expect(service.sendFromTemplate).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });
});
