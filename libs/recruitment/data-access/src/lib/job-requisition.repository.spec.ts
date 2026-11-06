import { PrismaService } from '@africahr/platform-database';
import { JobRequisitionRepository } from './job-requisition.repository';

describe('JobRequisitionRepository', () => {
  let repository: JobRequisitionRepository;
  let tx: { jobRequisition: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock; $queryRaw: jest.Mock };

  beforeEach(() => {
    tx = {
      jobRequisition: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = {
      withTenantContext: jest.fn((_tenantId, fn) => fn(tx)),
      $queryRaw: jest.fn(),
    };
    repository = new JobRequisitionRepository(prisma as unknown as PrismaService);
  });

  it('creates a requisition within the tenant context', async () => {
    await repository.create('tenant-1', {
      organizationId: 'org-1',
      title: 'Software Engineer',
      employmentType: 'FULL_TIME',
      createdBy: 'hr-1',
    });

    expect(tx.jobRequisition.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        title: 'Software Engineer',
        employmentType: 'FULL_TIME',
      }),
    });
  });

  it('lists requisitions filtered by hiringManagerId', async () => {
    await repository.list('tenant-1', { hiringManagerId: 'mgr-emp-1' });

    expect(tx.jobRequisition.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        organizationId: undefined,
        hiringManagerId: 'mgr-emp-1',
        status: undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updates status', async () => {
    await repository.update('tenant-1', 'req-1', { status: 'OPEN', updatedBy: 'hr-1' });

    expect(tx.jobRequisition.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: expect.objectContaining({ status: 'OPEN', updatedBy: 'hr-1' }),
    });
  });

  it('findOpenByIdAcrossTenants looks up an OPEN requisition without a tenant filter via the SECURITY DEFINER function', async () => {
    prisma.$queryRaw.mockResolvedValue([{ id: 'req-1', status: 'OPEN' }]);

    const result = await repository.findOpenByIdAcrossTenants('req-1');

    expect(prisma.withTenantContext).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual({ id: 'req-1', status: 'OPEN' });
  });

  it('findOpenByIdAcrossTenants returns null when no requisition matches', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await expect(repository.findOpenByIdAcrossTenants('missing')).resolves.toBeNull();
  });
});
