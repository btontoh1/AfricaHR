import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyPaymentMethodController } from './my-payment-method.controller';
import { PaymentMethodService } from './payment-method.service';

describe('MyPaymentMethodController', () => {
  let controller: MyPaymentMethodController;
  let service: jest.Mocked<PaymentMethodService>;

  const employee: RequestUser = {
    sub: 'emp-user-1',
    email: 'frimpong@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      getForSelf: jest.fn(),
      upsertForSelf: jest.fn(),
    } as unknown as jest.Mocked<PaymentMethodService>;

    controller = new MyPaymentMethodController(service);
  });

  it('gets the caller\'s own payment method via their user id', () => {
    controller.get('tenant-1', employee);

    expect(service.getForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1');
  });

  it('upserts the caller\'s own payment method via their user id', () => {
    const dto = { type: 'BANK_ACCOUNT', bankName: 'GCB Bank', accountNumber: '123', accountName: 'A' } as never;

    controller.upsert('tenant-1', dto, employee);

    expect(service.upsertForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', dto);
  });

  it('rejects an actor acting on a different tenant even for self-service routes', () => {
    expect(() => controller.get('tenant-2', employee)).toThrow(ForbiddenException);
  });
});
