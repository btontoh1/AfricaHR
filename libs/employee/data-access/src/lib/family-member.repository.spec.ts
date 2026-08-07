import { PrismaService } from '@africahr/platform-database';
import { FamilyMemberRepository } from './family-member.repository';

describe('FamilyMemberRepository', () => {
  let repository: FamilyMemberRepository;
  let tx: {
    employeeFamilyMember: { deleteMany: jest.Mock; createMany: jest.Mock; findMany: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      employeeFamilyMember: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new FamilyMemberRepository(prisma as unknown as PrismaService);
  });

  it('lists family members for an employee, parents then children', async () => {
    await repository.listByEmployee('tenant-1', 'emp-1');

    expect(tx.employeeFamilyMember.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'emp-1' },
      orderBy: [{ relationship: 'asc' }, { createdAt: 'asc' }],
    });
  });

  it('replaces the full set of dependents within the tenant context', async () => {
    await repository.replaceForEmployee('tenant-1', 'emp-1', [
      { relationship: 'PARENT', name: 'Ama Mensah', dateOfBirth: new Date('1970-01-01') },
      { relationship: 'CHILD', name: 'Kwame Mensah' },
    ]);

    expect(tx.employeeFamilyMember.deleteMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'emp-1' },
    });
    expect(tx.employeeFamilyMember.createMany).toHaveBeenCalledWith({
      data: [
        {
          tenantId: 'tenant-1',
          employeeId: 'emp-1',
          relationship: 'PARENT',
          name: 'Ama Mensah',
          dateOfBirth: new Date('1970-01-01'),
        },
        {
          tenantId: 'tenant-1',
          employeeId: 'emp-1',
          relationship: 'CHILD',
          name: 'Kwame Mensah',
          dateOfBirth: undefined,
        },
      ],
    });
  });

  it('skips createMany when the new list is empty (clears all dependents)', async () => {
    await repository.replaceForEmployee('tenant-1', 'emp-1', []);

    expect(tx.employeeFamilyMember.deleteMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'emp-1' },
    });
    expect(tx.employeeFamilyMember.createMany).not.toHaveBeenCalled();
  });
});
