import { randomBytes } from 'node:crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AttendanceRecord } from '@prisma/client';
import { AttendanceEmployeeRepository, AttendanceRecordRepository } from '@africahr/attendance-data-access';
import { AppConfigService } from '@africahr/platform-core';
import { AttendanceKioskService } from './attendance-kiosk.service';
import { AttendanceRecordService } from './attendance-record.service';

describe('AttendanceKioskService', () => {
  let service: AttendanceKioskService;
  let employees: jest.Mocked<AttendanceEmployeeRepository>;
  let records: jest.Mocked<AttendanceRecordRepository>;
  let attendance: jest.Mocked<AttendanceRecordService>;
  let config: jest.Mocked<AppConfigService>;

  function makeRecord(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
    return {
      id: 'rec-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      date: new Date(),
      clockIn: new Date(),
      clockOut: null,
      hoursWorked: null,
      overtimeHours: null,
      notes: null,
      clockInLatitude: null,
      clockInLongitude: null,
      clockInDistanceMeters: null,
      clockInOutsideGeofence: null,
      clockInLocationName: null,
      clockOutLatitude: null,
      clockOutLongitude: null,
      clockOutDistanceMeters: null,
      clockOutOutsideGeofence: null,
      clockOutLocationName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      deletedAt: null,
      ...overrides,
    } as AttendanceRecord;
  }

  beforeEach(() => {
    employees = {
      listActiveForKiosk: jest.fn(),
      setClockInPinHash: jest.fn(),
      isPinLookupHashTaken: jest.fn().mockResolvedValue(false),
      findByIdWithPin: jest.fn(),
    } as unknown as jest.Mocked<AttendanceEmployeeRepository>;
    records = {
      findOpenByEmployee: jest.fn(),
    } as unknown as jest.Mocked<AttendanceRecordRepository>;
    attendance = {
      clockIn: jest.fn(),
      clockOut: jest.fn(),
    } as unknown as jest.Mocked<AttendanceRecordService>;
    config = {
      kioskPinLookupSecret: randomBytes(32).toString('hex'),
    } as unknown as jest.Mocked<AppConfigService>;
    service = new AttendanceKioskService(employees, records, attendance, config);
  });

  describe('setPin', () => {
    it('stores an argon2 hash, not the raw PIN', async () => {
      await service.setPin('tenant-1', 'emp-1', '4821');

      const [, , storedHash] = employees.setClockInPinHash.mock.calls[0];
      expect(storedHash).not.toBe('4821');
      await expect(argon2.verify(storedHash, '4821')).resolves.toBe(true);
    });

    it('also stores a deterministic lookup hash alongside the argon2 hash', async () => {
      await service.setPin('tenant-1', 'emp-1', '4821');

      const [, , , lookupHash] = employees.setClockInPinHash.mock.calls[0];
      expect(typeof lookupHash).toBe('string');
      expect(lookupHash.length).toBeGreaterThan(0);
    });

    it('checks uniqueness excluding the employee being set, before writing', async () => {
      await service.setPin('tenant-1', 'emp-1', '4821');

      expect(employees.isPinLookupHashTaken).toHaveBeenCalledWith('tenant-1', expect.any(String), 'emp-1');
      expect(employees.setClockInPinHash).toHaveBeenCalled();
    });

    it('rejects a PIN already used by another employee, without writing anything', async () => {
      employees.isPinLookupHashTaken.mockResolvedValue(true);

      await expect(service.setPin('tenant-1', 'emp-1', '4821')).rejects.toThrow(BadRequestException);
      expect(employees.setClockInPinHash).not.toHaveBeenCalled();
    });
  });

  describe('clock', () => {
    it('throws the same generic error when no PIN has been set', async () => {
      employees.findByIdWithPin.mockResolvedValue({
        id: 'emp-1',
        firstName: 'Ama',
        lastName: 'Owusu',
        clockInPinHash: null,
      });

      await expect(service.clock('tenant-1', 'emp-1', '4821')).rejects.toThrow(
        new UnauthorizedException('Incorrect PIN'),
      );
    });

    it('throws the same generic error for a wrong PIN', async () => {
      employees.findByIdWithPin.mockResolvedValue({
        id: 'emp-1',
        firstName: 'Ama',
        lastName: 'Owusu',
        clockInPinHash: await argon2.hash('4821'),
      });

      await expect(service.clock('tenant-1', 'emp-1', '0000')).rejects.toThrow(
        new UnauthorizedException('Incorrect PIN'),
      );
    });

    it('clocks in when the employee has no open record', async () => {
      const pinHash = await argon2.hash('4821');
      employees.findByIdWithPin.mockResolvedValue({
        id: 'emp-1',
        firstName: 'Ama',
        lastName: 'Owusu',
        clockInPinHash: pinHash,
      });
      records.findOpenByEmployee.mockResolvedValue(null);
      const clockInAt = new Date();
      attendance.clockIn.mockResolvedValue(makeRecord({ clockIn: clockInAt }));

      const result = await service.clock('tenant-1', 'emp-1', '4821');

      expect(attendance.clockIn).toHaveBeenCalledWith('tenant-1', 'emp-1');
      expect(attendance.clockOut).not.toHaveBeenCalled();
      expect(result).toEqual({ action: 'CLOCKED_IN', employeeName: 'Ama Owusu', at: clockInAt });
    });

    it('clocks out when the employee already has an open record', async () => {
      const pinHash = await argon2.hash('4821');
      employees.findByIdWithPin.mockResolvedValue({
        id: 'emp-1',
        firstName: 'Ama',
        lastName: 'Owusu',
        clockInPinHash: pinHash,
      });
      records.findOpenByEmployee.mockResolvedValue(makeRecord());
      const clockOutAt = new Date();
      attendance.clockOut.mockResolvedValue(makeRecord({ clockOut: clockOutAt }));

      const result = await service.clock('tenant-1', 'emp-1', '4821');

      expect(attendance.clockOut).toHaveBeenCalledWith('tenant-1', 'emp-1');
      expect(attendance.clockIn).not.toHaveBeenCalled();
      expect(result).toEqual({ action: 'CLOCKED_OUT', employeeName: 'Ama Owusu', at: clockOutAt });
    });
  });
});
