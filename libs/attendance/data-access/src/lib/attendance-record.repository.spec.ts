import { PrismaService } from '@africahr/platform-database';
import { AttendanceRecordRepository } from './attendance-record.repository';

describe('AttendanceRecordRepository', () => {
  let repository: AttendanceRecordRepository;
  let tx: {
    attendanceRecord: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      attendanceRecord: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new AttendanceRecordRepository(prisma as unknown as PrismaService);
  });

  it('creates a record within the tenant context', async () => {
    const date = new Date('2026-02-02');
    const clockIn = new Date('2026-02-02T08:00:00Z');

    await repository.create('tenant-1', {
      employeeId: 'emp-1',
      date,
      clockIn,
      createdBy: 'emp-1-user',
    });

    expect(tx.attendanceRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-1', employeeId: 'emp-1', date, clockIn }),
    });
  });

  it('finds the currently open record regardless of which day it started on', async () => {
    await repository.findOpenByEmployee('tenant-1', 'emp-1');

    expect(tx.attendanceRecord.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'emp-1', clockOut: null, deletedAt: null },
      orderBy: { date: 'desc' },
    });
  });

  it('lists within a date range filtered by employee', async () => {
    const from = new Date('2026-02-01');
    const to = new Date('2026-02-28');

    await repository.list('tenant-1', { employeeId: 'emp-1', from, to });

    expect(tx.attendanceRecord.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, employeeId: 'emp-1', date: { gte: from, lte: to } },
      orderBy: { date: 'desc' },
    });
  });

  it('lists without a date filter when no range is given', async () => {
    await repository.list('tenant-1', {});

    expect(tx.attendanceRecord.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, employeeId: undefined, date: undefined },
      orderBy: { date: 'desc' },
    });
  });

  it('updates clock-out fields', async () => {
    const clockOut = new Date('2026-02-02T17:00:00Z');

    await repository.update('tenant-1', 'rec-1', {
      clockOut,
      hoursWorked: 9,
      overtimeHours: 1,
      updatedBy: 'emp-1-user',
    });

    expect(tx.attendanceRecord.update).toHaveBeenCalledWith({
      where: { id: 'rec-1' },
      data: expect.objectContaining({ clockOut, hoursWorked: 9, overtimeHours: 1 }),
    });
  });

  it('persists clock-in geofence fields on create', async () => {
    await repository.create('tenant-1', {
      employeeId: 'emp-1',
      date: new Date('2026-02-02'),
      clockIn: new Date('2026-02-02T08:00:00Z'),
      clockInLatitude: 5.6,
      clockInLongitude: -0.19,
      clockInDistanceMeters: 340,
      clockInOutsideGeofence: true,
    });

    expect(tx.attendanceRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clockInLatitude: 5.6,
        clockInLongitude: -0.19,
        clockInDistanceMeters: 340,
        clockInOutsideGeofence: true,
      }),
    });
  });

  it('persists clock-out geofence fields on update', async () => {
    await repository.update('tenant-1', 'rec-1', {
      clockOut: new Date('2026-02-02T17:00:00Z'),
      clockOutLatitude: 5.61,
      clockOutLongitude: -0.2,
      clockOutDistanceMeters: 20,
      clockOutOutsideGeofence: false,
    });

    expect(tx.attendanceRecord.update).toHaveBeenCalledWith({
      where: { id: 'rec-1' },
      data: expect.objectContaining({
        clockOutLatitude: 5.61,
        clockOutLongitude: -0.2,
        clockOutDistanceMeters: 20,
        clockOutOutsideGeofence: false,
      }),
    });
  });
});
