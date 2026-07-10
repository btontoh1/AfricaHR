import { PrismaService } from '@africahr/platform-database';
import { NotificationTemplateRepository } from './notification-template.repository';

describe('NotificationTemplateRepository', () => {
  let repository: NotificationTemplateRepository;
  let tx: {
    notificationTemplate: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      notificationTemplate: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new NotificationTemplateRepository(prisma as unknown as PrismaService);
  });

  it('creates a template within the tenant context', async () => {
    await repository.create('tenant-1', {
      code: 'LEAVE_APPROVED',
      name: 'Leave Approved',
      channel: 'IN_APP',
      subjectTemplate: 'Leave approved',
      bodyTemplate: 'Hi {{firstName}}, your leave was approved.',
      createdBy: 'hr-1',
    });

    expect(tx.notificationTemplate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        code: 'LEAVE_APPROVED',
        channel: 'IN_APP',
      }),
    });
  });

  it('lists only active templates when activeOnly is set', async () => {
    await repository.list('tenant-1', { activeOnly: true });

    expect(tx.notificationTemplate.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
    });
  });

  it('updates a template', async () => {
    await repository.update('tenant-1', 'tmpl-1', { isActive: false, updatedBy: 'hr-1' });

    expect(tx.notificationTemplate.update).toHaveBeenCalledWith({
      where: { id: 'tmpl-1' },
      data: expect.objectContaining({ isActive: false, updatedBy: 'hr-1' }),
    });
  });
});
