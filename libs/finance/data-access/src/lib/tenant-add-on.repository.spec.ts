import { PrismaService } from '@africahr/platform-database';
import { AddOnModule } from '@prisma/client';
import { TenantAddOnRepository } from './tenant-add-on.repository';

describe('TenantAddOnRepository', () => {
  let repository: TenantAddOnRepository;
  let prisma: { tenant: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { tenant: { findUnique: jest.fn() } };
    repository = new TenantAddOnRepository(prisma as unknown as PrismaService);
  });

  it('returns true when the tenant has the add-on enabled', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ enabledAddOns: [AddOnModule.FINANCE] });

    const result = await repository.isEnabled('tenant-1', AddOnModule.FINANCE);

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      select: { enabledAddOns: true },
    });
    expect(result).toBe(true);
  });

  it('returns false when the tenant does not have the add-on enabled', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ enabledAddOns: [AddOnModule.RECRUITMENT] });

    const result = await repository.isEnabled('tenant-1', AddOnModule.FINANCE);

    expect(result).toBe(false);
  });

  it('returns false when the tenant does not exist', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);

    const result = await repository.isEnabled('missing-tenant', AddOnModule.FINANCE);

    expect(result).toBe(false);
  });
});
