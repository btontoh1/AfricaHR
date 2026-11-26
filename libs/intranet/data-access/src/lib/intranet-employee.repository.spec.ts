import { PrismaService } from '@africahr/platform-database';
import { IntranetEmployeeRepository } from './intranet-employee.repository';

describe('IntranetEmployeeRepository', () => {
  let repository: IntranetEmployeeRepository;
  let delegate: { findFirst: jest.Mock };
  let withTenantContext: jest.Mock;
  let prisma: { employee: typeof delegate; withTenantContext: jest.Mock };

  beforeEach(() => {
    delegate = { findFirst: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ employee: delegate }));
    prisma = { employee: delegate, withTenantContext };

    repository = new IntranetEmployeeRepository(prisma as unknown as PrismaService);
  });

  it('findByUserId selects the org/unit fields audience targeting needs', async () => {
    delegate.findFirst.mockResolvedValue({ id: 'employee-1' });

    await repository.findByUserId('tenant-1', 'user-1');

    expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', deletedAt: null },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        organizationUnitId: true,
        firstName: true,
        lastName: true,
      },
    });
  });

  it('findById looks up by employee id instead of user id', async () => {
    delegate.findFirst.mockResolvedValue(null);

    const result = await repository.findById('tenant-1', 'employee-1');

    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: { id: 'employee-1', tenantId: 'tenant-1', deletedAt: null },
      select: expect.any(Object),
    });
    expect(result).toBeNull();
  });
});
