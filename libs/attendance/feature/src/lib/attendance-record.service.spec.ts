import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttendancePolicy, AttendanceRecord, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  AttendanceEmployeeRepository,
  AttendancePolicyRepository,
  AttendanceRecordRepository,
} from '@africahr/attendance-data-access';
import { AttendanceRecordService } from './attendance-record.service';

describe('AttendanceRecordService', () => {
  let service: AttendanceRecordService;
  let records: jest.Mocked<AttendanceRecordRepository>;
  let policies: jest.Mocked<AttendancePolicyRepository>;
  let employees: jest.Mocked<AttendanceEmployeeRepository>;
  let audit: jest.Mocked<AuditService>;

  const now = new Date('2026-02-02T17:00:00Z');

  function makePolicy(overrides: Partial<AttendancePolicy> = {}): AttendancePolicy {
    return {
      id: 'policy-1',
      tenantId: 'tenant-1',
      standardDailyHours: new Prisma.Decimal(8),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as AttendancePolicy;
  }

  function makeRecord(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
    return {
      id: 'rec-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      date: new Date('2026-02-02'),
      clockIn: new Date('2026-02-02T08:00:00Z'),
      clockOut: null,
      hoursWorked: null,
      overtimeHours: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as AttendanceRecord;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    records = {
      create: jest.fn(),
      findById: jest.fn(),
      findOpenByEmployee: jest.fn().mockResolvedValue(null),
      list: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<AttendanceRecordRepository>;

    policies = {
      upsert: jest.fn(),
      find: jest.fn().mockResolvedValue(makePolicy()),
    } as unknown as jest.Mocked<AttendancePolicyRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<AttendanceEmployeeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new AttendanceRecordService(records, policies, employees, audit);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('resolveOwnEmployeeId', () => {
    it('throws ForbiddenException when the user has no linked employee', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.resolveOwnEmployeeId('tenant-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('clockIn', () => {
    it('rejects clocking in while a shift (possibly from a prior day) is still open', async () => {
      records.findOpenByEmployee.mockResolvedValue(makeRecord());

      await expect(service.clockIn('tenant-1', 'emp-1')).rejects.toThrow(ConflictException);
      expect(records.create).not.toHaveBeenCalled();
    });

    it('allows clocking in again on the same day once the earlier shift is closed', async () => {
      // No open record (the earlier shift was already clocked out) - only
      // findOpenByEmployee gates a new clock-in, not "is there already a
      // record for today", so a second clock-in/out cycle is allowed.
      records.findOpenByEmployee.mockResolvedValue(null);
      records.create.mockResolvedValue(makeRecord({ id: 'rec-2', clockIn: now }));

      await service.clockIn('tenant-1', 'emp-1');

      expect(records.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeId: 'emp-1', clockIn: now }),
      );
    });

    it('creates a record with clockIn=now and audits', async () => {
      records.create.mockResolvedValue(makeRecord({ clockIn: now }));

      await service.clockIn('tenant-1', 'emp-1', 'emp-1-user');

      expect(records.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeId: 'emp-1', clockIn: now }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'attendance.clocked_in' }),
      );
    });
  });

  describe('clockOut', () => {
    it('rejects when there is no currently open record', async () => {
      records.findOpenByEmployee.mockResolvedValue(null);

      await expect(service.clockOut('tenant-1', 'emp-1')).rejects.toThrow(ConflictException);
    });

    it('rejects when no attendance policy is configured', async () => {
      records.findOpenByEmployee.mockResolvedValue(makeRecord());
      policies.find.mockResolvedValue(null);

      await expect(service.clockOut('tenant-1', 'emp-1')).rejects.toThrow(ConflictException);
      expect(records.update).not.toHaveBeenCalled();
    });

    it('computes hoursWorked/overtimeHours and updates the record', async () => {
      // clocked in at 08:00, "now" (clock-out) is 17:00 = 9 hours, 1 hour overtime at an 8h policy
      records.findOpenByEmployee.mockResolvedValue(
        makeRecord({ clockIn: new Date('2026-02-02T08:00:00Z') }),
      );
      records.update.mockResolvedValue(makeRecord({ clockOut: now }));

      await service.clockOut('tenant-1', 'emp-1', 'emp-1-user');

      expect(records.update).toHaveBeenCalledWith(
        'tenant-1',
        'rec-1',
        expect.objectContaining({ clockOut: now, hoursWorked: 9, overtimeHours: 1 }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'attendance.clocked_out' }),
      );
    });

    it('finds and closes a shift that started on a prior calendar day (overnight shift)', async () => {
      // shift started yesterday at 22:00, clock-out happens "now" (2026-02-02T17:00:00Z per fake timer) —
      // the point is this must be found via findOpenByEmployee, not a same-day lookup
      records.findOpenByEmployee.mockResolvedValue(
        makeRecord({ date: new Date('2026-02-01'), clockIn: new Date('2026-02-01T22:00:00Z') }),
      );
      records.update.mockResolvedValue(makeRecord({ clockOut: now }));

      await service.clockOut('tenant-1', 'emp-1');

      expect(records.findOpenByEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1');
      expect(records.update).toHaveBeenCalledWith(
        'tenant-1',
        'rec-1',
        expect.objectContaining({ clockOut: now }),
      );
    });
  });

  describe('create (HR manual entry)', () => {
    it('translates a foreign-key violation into NotFoundException', async () => {
      records.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('tenant-1', { employeeId: 'missing', date: '2026-02-02' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('computes hours when both clockIn and clockOut are provided', async () => {
      records.create.mockResolvedValue(makeRecord());

      await service.create('tenant-1', {
        employeeId: 'emp-1',
        date: '2026-02-02',
        clockIn: '2026-02-02T08:00:00Z',
        clockOut: '2026-02-02T17:00:00Z',
      });

      expect(records.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ hoursWorked: 9, overtimeHours: 1 }),
      );
    });

    it('leaves hours undefined when only clockIn is provided (still open)', async () => {
      records.create.mockResolvedValue(makeRecord());

      await service.create('tenant-1', {
        employeeId: 'emp-1',
        date: '2026-02-02',
        clockIn: '2026-02-02T08:00:00Z',
      });

      expect(records.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ hoursWorked: undefined, overtimeHours: undefined }),
      );
    });
  });

  describe('update (HR correction)', () => {
    it('recomputes hours when the correction supplies both clockIn and clockOut', async () => {
      records.findById.mockResolvedValue(makeRecord({ clockIn: null, clockOut: null }));
      records.update.mockResolvedValue(makeRecord());

      await service.update('tenant-1', 'rec-1', {
        clockIn: '2026-02-02T09:00:00Z',
        clockOut: '2026-02-02T17:00:00Z',
      });

      expect(records.update).toHaveBeenCalledWith(
        'tenant-1',
        'rec-1',
        expect.objectContaining({ hoursWorked: 8, overtimeHours: 0 }),
      );
    });

    it('preserves prior computed hours when clockOut is still missing', async () => {
      records.findById.mockResolvedValue(
        makeRecord({ clockOut: null, hoursWorked: null, overtimeHours: null }),
      );
      records.update.mockResolvedValue(makeRecord());

      await service.update('tenant-1', 'rec-1', { notes: 'forgot to clock out' });

      expect(records.update).toHaveBeenCalledWith(
        'tenant-1',
        'rec-1',
        expect.objectContaining({ hoursWorked: undefined, overtimeHours: undefined }),
      );
    });
  });
});
