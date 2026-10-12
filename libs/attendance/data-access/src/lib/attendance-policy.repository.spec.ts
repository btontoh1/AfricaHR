import { PrismaService } from '@africahr/platform-database';
import { AttendancePolicyRepository } from './attendance-policy.repository';

describe('AttendancePolicyRepository', () => {
  let repository: AttendancePolicyRepository;
  let tx: { attendancePolicy: { upsert: jest.Mock; findUnique: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { attendancePolicy: { upsert: jest.fn(), findUnique: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new AttendancePolicyRepository(prisma as unknown as PrismaService);
  });

  it('upserts on the tenant single-row key', async () => {
    await repository.upsert('tenant-1', { standardDailyHours: 8, actorId: 'hr-1' });

    expect(tx.attendancePolicy.upsert).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      create: expect.objectContaining({ tenantId: 'tenant-1', standardDailyHours: 8 }),
      update: expect.objectContaining({ standardDailyHours: 8 }),
    });
  });

  it('finds the tenant policy', async () => {
    await repository.find('tenant-1');

    expect(tx.attendancePolicy.findUnique).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
  });
});
