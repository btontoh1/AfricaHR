import { ForbiddenException } from '@nestjs/common';
import { Prisma, TenantPayrollWallet } from '@prisma/client';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { TenantPayrollWalletController } from './tenant-payroll-wallet.controller';
import { TenantPayrollWalletService } from './tenant-payroll-wallet.service';

describe('TenantPayrollWalletController', () => {
  let controller: TenantPayrollWalletController;
  let service: jest.Mocked<TenantPayrollWalletService>;

  const tenantAdmin: RequestUser = {
    sub: 'admin-1',
    email: 'admin@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listBalances: jest.fn(),
      listTopUps: jest.fn(),
      requestTopUp: jest.fn(),
    } as unknown as jest.Mocked<TenantPayrollWalletService>;
    controller = new TenantPayrollWalletController(service);
  });

  it('returns balances as plain numbers', async () => {
    service.listBalances.mockResolvedValue([
      { currency: 'GHS', balance: new Prisma.Decimal(500) } as TenantPayrollWallet,
    ]);

    const result = await controller.balances('tenant-1', tenantAdmin);

    expect(result).toEqual([{ currency: 'GHS', balance: 500 }]);
  });

  it('lists top-ups within the route tenant', () => {
    controller.listTopUps('tenant-1', tenantAdmin);

    expect(service.listTopUps).toHaveBeenCalledWith('tenant-1');
  });

  it('requests a top-up within the route tenant when the actor matches', () => {
    const dto = { currency: 'GHS', amount: 500 } as never;

    controller.requestTopUp('tenant-1', dto, tenantAdmin);

    expect(service.requestTopUp).toHaveBeenCalledWith('tenant-1', 'GHS', 500, 'admin-1');
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.listTopUps('tenant-2', tenantAdmin)).toThrow(ForbiddenException);
  });
});
