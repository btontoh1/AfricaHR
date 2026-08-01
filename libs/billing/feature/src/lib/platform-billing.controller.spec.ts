import { PlatformBillingController } from './platform-billing.controller';
import { PlatformBillingService } from './platform-billing.service';

describe('PlatformBillingController', () => {
  let controller: PlatformBillingController;
  let service: jest.Mocked<PlatformBillingService>;

  beforeEach(() => {
    service = { getSummary: jest.fn() } as unknown as jest.Mocked<PlatformBillingService>;
    controller = new PlatformBillingController(service);
  });

  it('delegates getSummary to PlatformBillingService', () => {
    controller.getSummary();

    expect(service.getSummary).toHaveBeenCalled();
  });
});
