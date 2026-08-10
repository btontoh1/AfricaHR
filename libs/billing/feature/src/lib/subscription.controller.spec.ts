import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: jest.Mocked<SubscriptionService>;

  const actor: RequestUser = {
    sub: 'ops-1',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      assign: jest.fn(),
      getForTenant: jest.fn(),
      cancel: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionService>;

    controller = new SubscriptionController(service);
  });

  it('delegates get with the tenant id', () => {
    controller.get('tenant-9');

    expect(service.getForTenant).toHaveBeenCalledWith('tenant-9');
  });

  it('delegates assign with the tenant id, dto, and actor id', () => {
    controller.assign('tenant-9', { pricePerEmployee: 10, currency: 'GHS' }, actor);

    expect(service.assign).toHaveBeenCalledWith(
      'tenant-9',
      { pricePerEmployee: 10, currency: 'GHS' },
      'ops-1',
    );
  });

  it('delegates cancel with the tenant id and actor id', () => {
    controller.cancel('tenant-9', actor);

    expect(service.cancel).toHaveBeenCalledWith('tenant-9', 'ops-1');
  });
});
