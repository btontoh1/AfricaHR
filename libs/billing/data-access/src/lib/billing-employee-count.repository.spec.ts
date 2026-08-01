import { PrismaService } from '@africahr/platform-database';
import { BillingEmployeeCountRepository } from './billing-employee-count.repository';

describe('BillingEmployeeCountRepository', () => {
  let repository: BillingEmployeeCountRepository;
  let tx: { employee: { count: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { employee: { count: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new BillingEmployeeCountRepository(prisma as unknown as PrismaService);
  });

  it('counts active employees, excluding TERMINATED, scoped to the tenant', async () => {
    tx.employee.count.mockResolvedValue(20);

    const result = await repository.countActive('tenant-1');

    expect(result).toBe(20);
    expect(tx.employee.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, employmentStatus: { not: 'TERMINATED' } },
    });
  });
});
