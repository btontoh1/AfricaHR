import { PrismaService } from '@africahr/platform-database';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let create: jest.Mock;
  let withTenantContext: jest.Mock;
  let withPlatformScope: jest.Mock;
  let prisma: {
    auditLog: { create: jest.Mock };
    withTenantContext: jest.Mock;
    withPlatformScope: jest.Mock;
  };

  beforeEach(() => {
    create = jest.fn().mockResolvedValue(undefined);
    withTenantContext = jest.fn((_tenantId, fn) => fn({ auditLog: { create } }));
    withPlatformScope = jest.fn((fn) => fn({ auditLog: { create } }));
    prisma = { auditLog: { create }, withTenantContext, withPlatformScope };

    service = new AuditService(prisma as unknown as PrismaService);
  });

  it('writes through withTenantContext when tenantId is present', async () => {
    await service.record({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      action: 'user.created',
      resourceType: 'User',
      resourceId: 'user-2',
    });

    expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-1', action: 'user.created' }),
    });
  });

  it('writes under the platform scope when tenantId is null (platform-admin action)', async () => {
    await service.record({
      tenantId: null,
      actorUserId: null,
      action: 'tenant.created',
      resourceType: 'Tenant',
      resourceId: 'tenant-1',
    });

    expect(withTenantContext).not.toHaveBeenCalled();
    expect(withPlatformScope).toHaveBeenCalledWith(expect.any(Function));
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: null, action: 'tenant.created' }),
    });
  });

  it('swallows errors instead of throwing, so a logging failure never fails the caller', async () => {
    create.mockRejectedValue(new Error('db unavailable'));

    await expect(
      service.record({
        tenantId: null,
        actorUserId: null,
        action: 'tenant.created',
        resourceType: 'Tenant',
      }),
    ).resolves.toBeUndefined();
  });
});
