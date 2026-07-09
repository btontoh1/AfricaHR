import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { TenantStatus } from '@africahr/tenancy-domain';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

describe('TenantController', () => {
  let controller: TenantController;
  let tenants: jest.Mocked<TenantService>;

  const actor: RequestUser = {
    sub: 'ops-1',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    tenants = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<TenantService>;

    controller = new TenantController(tenants);
  });

  it('passes the actor id as createdBy on create', () => {
    const dto = { name: 'Acme', country: 'GH', currency: 'GHS', timezone: 'Africa/Accra' };

    controller.create(dto, actor);

    expect(tenants.create).toHaveBeenCalledWith(dto, 'ops-1');
  });

  it('passes the actor id as updatedBy on status update', () => {
    controller.updateStatus('tenant-1', { status: TenantStatus.ACTIVE }, actor);

    expect(tenants.updateStatus).toHaveBeenCalledWith('tenant-1', TenantStatus.ACTIVE, 'ops-1');
  });
});
