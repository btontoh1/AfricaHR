import { PrismaService } from '@africahr/platform-database';
import { ApplicationRepository } from './application.repository';

describe('ApplicationRepository', () => {
  let repository: ApplicationRepository;
  let tx: {
    application: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      application: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new ApplicationRepository(prisma as unknown as PrismaService);
  });

  it('creates an application within the tenant context', async () => {
    await repository.create('tenant-1', {
      candidateId: 'cand-1',
      requisitionId: 'req-1',
      createdBy: 'hr-1',
    });

    expect(tx.application.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-1', candidateId: 'cand-1', requisitionId: 'req-1' }),
    });
  });

  it('finds an application by candidate and requisition', async () => {
    await repository.findByCandidateAndRequisition('tenant-1', 'cand-1', 'req-1');

    expect(tx.application.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', candidateId: 'cand-1', requisitionId: 'req-1', deletedAt: null },
    });
  });

  it('finds an application by id with candidate and requisition included', async () => {
    await repository.findById('tenant-1', 'app-1');

    expect(tx.application.findFirst).toHaveBeenCalledWith({
      where: { id: 'app-1', tenantId: 'tenant-1', deletedAt: null },
      include: { candidate: true, requisition: true },
    });
  });

  it('updates stage and offer fields', async () => {
    const offerSentAt = new Date('2026-03-01');

    await repository.update('tenant-1', 'app-1', {
      stage: 'OFFER',
      offeredSalary: 5000,
      offerSentAt,
      updatedBy: 'hr-1',
    });

    expect(tx.application.update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: expect.objectContaining({ stage: 'OFFER', offeredSalary: 5000, offerSentAt }),
    });
  });
});
