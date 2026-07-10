import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { NotificationTemplateController } from './notification-template.controller';
import { NotificationTemplateService } from './notification-template.service';

describe('NotificationTemplateController', () => {
  let controller: NotificationTemplateController;
  let service: jest.Mocked<NotificationTemplateService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<NotificationTemplateService>;

    controller = new NotificationTemplateController(service);
  });

  it('lists with an activeOnly filter within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'true');

    expect(service.list).toHaveBeenCalledWith('tenant-1', { activeOnly: true });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'tmpl-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates create with tenant, dto, and actor', () => {
    const dto = { code: 'X', name: 'X', channel: 'IN_APP', subjectTemplate: 's', bodyTemplate: 'b' } as never;

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('delegates update with tenant, id, dto, and actor', () => {
    const dto = { isActive: false };

    controller.update('tenant-1', 'tmpl-1', dto, hrManager);

    expect(service.update).toHaveBeenCalledWith('tenant-1', 'tmpl-1', dto, 'hr-1');
  });
});
