import { PrismaService } from '@africahr/platform-database';
import { PolicyAcknowledgementRepository } from './policy-acknowledgement.repository';

describe('PolicyAcknowledgementRepository', () => {
  let repository: PolicyAcknowledgementRepository;
  let delegate: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  let withTenantContext: jest.Mock;
  let prisma: { policyAcknowledgement: typeof delegate; withTenantContext: jest.Mock };

  beforeEach(() => {
    delegate = { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ policyAcknowledgement: delegate }));
    prisma = { policyAcknowledgement: delegate, withTenantContext };

    repository = new PolicyAcknowledgementRepository(prisma as unknown as PrismaService);
  });

  it('findOne looks up by tenant, policy and employee', async () => {
    delegate.findFirst.mockResolvedValue({ id: 'ack-1' });

    const result = await repository.findOne('tenant-1', 'policy-1', 'employee-1');

    expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', policyId: 'policy-1', employeeId: 'employee-1' },
    });
    expect(result).toEqual({ id: 'ack-1' });
  });

  it('create inserts a bare acknowledgement row', async () => {
    delegate.create.mockResolvedValue({ id: 'ack-1' });

    await repository.create('tenant-1', 'policy-1', 'employee-1');

    expect(delegate.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', policyId: 'policy-1', employeeId: 'employee-1' },
    });
  });

  it('listPolicyIdsAcknowledgedByEmployee returns just the policy ids', async () => {
    delegate.findMany.mockResolvedValue([{ policyId: 'policy-1' }, { policyId: 'policy-2' }]);

    const result = await repository.listPolicyIdsAcknowledgedByEmployee('tenant-1', 'employee-1');

    expect(delegate.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'employee-1' },
      select: { policyId: true },
    });
    expect(result).toEqual(['policy-1', 'policy-2']);
  });

  it('listForPolicy includes the acknowledging employee, newest first', async () => {
    delegate.findMany.mockResolvedValue([]);

    await repository.listForPolicy('tenant-1', 'policy-1');

    expect(delegate.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', policyId: 'policy-1' },
      orderBy: { readAt: 'desc' },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });
  });
});
