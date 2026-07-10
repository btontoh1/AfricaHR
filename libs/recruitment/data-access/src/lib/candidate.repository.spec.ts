import { PrismaService } from '@africahr/platform-database';
import { CandidateRepository } from './candidate.repository';

describe('CandidateRepository', () => {
  let repository: CandidateRepository;
  let tx: { candidate: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      candidate: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new CandidateRepository(prisma as unknown as PrismaService);
  });

  it('creates a candidate within the tenant context', async () => {
    await repository.create('tenant-1', {
      firstName: 'Kojo',
      lastName: 'Appiah',
      email: 'kojo@example.com',
      createdBy: 'hr-1',
    });

    expect(tx.candidate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-1', firstName: 'Kojo', email: 'kojo@example.com' }),
    });
  });

  it('lists candidates filtered by email', async () => {
    await repository.list('tenant-1', { email: 'kojo@example.com' });

    expect(tx.candidate.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, email: 'kojo@example.com' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
