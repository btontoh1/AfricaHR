import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let service: jest.Mocked<InvoiceService>;

  const actor: RequestUser = {
    sub: 'ops-1',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listForTenant: jest.fn(),
      generate: jest.fn(),
      markPaidManually: jest.fn(),
    } as unknown as jest.Mocked<InvoiceService>;

    controller = new InvoiceController(service);
  });

  it('delegates list with the tenant id', () => {
    controller.list('tenant-9');

    expect(service.listForTenant).toHaveBeenCalledWith('tenant-9');
  });

  it('delegates generate with the tenant id and actor id', () => {
    controller.generate('tenant-9', actor);

    expect(service.generate).toHaveBeenCalledWith('tenant-9', 'ops-1');
  });

  it('delegates markPaid with the tenant id, invoice id, and actor id', () => {
    controller.markPaid('tenant-9', 'inv-1', actor);

    expect(service.markPaidManually).toHaveBeenCalledWith('tenant-9', 'inv-1', 'ops-1');
  });
});
