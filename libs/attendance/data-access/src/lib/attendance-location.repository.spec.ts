import { PrismaService } from '@africahr/platform-database';
import { AttendanceLocationRepository } from './attendance-location.repository';

describe('AttendanceLocationRepository', () => {
  let repository: AttendanceLocationRepository;
  let tx: {
    attendanceLocation: {
      create: jest.Mock;
      update: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      delete: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      attendanceLocation: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new AttendanceLocationRepository(prisma as unknown as PrismaService);
  });

  it('creates a location within the tenant context', async () => {
    await repository.create('tenant-1', {
      name: 'HQ',
      latitude: 5.6,
      longitude: -0.19,
      radiusMeters: 150,
      actorId: 'hr-1',
    });

    expect(tx.attendanceLocation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        name: 'HQ',
        latitude: 5.6,
        longitude: -0.19,
        radiusMeters: 150,
        createdBy: 'hr-1',
        updatedBy: 'hr-1',
      }),
    });
  });

  it('updates a location by id', async () => {
    await repository.update('tenant-1', 'loc-1', { name: 'HQ renamed', radiusMeters: 200, actorId: 'hr-1' });

    expect(tx.attendanceLocation.update).toHaveBeenCalledWith({
      where: { id: 'loc-1' },
      data: expect.objectContaining({ name: 'HQ renamed', radiusMeters: 200, updatedBy: 'hr-1' }),
    });
  });

  it('finds a location by id scoped to the tenant', async () => {
    await repository.findById('tenant-1', 'loc-1');

    expect(tx.attendanceLocation.findFirst).toHaveBeenCalledWith({ where: { id: 'loc-1', tenantId: 'tenant-1' } });
  });

  it('lists all of a tenant locations', async () => {
    await repository.list('tenant-1');

    expect(tx.attendanceLocation.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { name: 'asc' },
    });
  });

  it('hard-deletes a location by id', async () => {
    await repository.delete('tenant-1', 'loc-1');

    expect(tx.attendanceLocation.delete).toHaveBeenCalledWith({ where: { id: 'loc-1' } });
  });
});
