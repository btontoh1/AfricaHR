import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AttendanceEmployeeRepository, AttendanceRecordRepository } from '@africahr/attendance-data-access';
import { AppConfigService, deriveEncryptionKey, hashPinForLookup } from '@africahr/platform-core';
import { AttendanceRecordService } from './attendance-record.service';
import { KioskEmployeeResponseDto } from './dto/kiosk-employee-response.dto';
import { KioskClockResponseDto } from './dto/kiosk-clock-response.dto';

/**
 * Drives the shared physical kiosk device: listing employees for the
 * tap-your-name picker, and clocking in/out by employeeId + PIN instead of
 * a logged-in user session. A separate surface from AttendanceRecordService's
 * self-service clockInForSelf/clockOutForSelf, which resolve "self" from the
 * caller's own JWT — a kiosk has one shared JWT (the SystemRole.KIOSK
 * device account) acting on behalf of whichever employee is standing in
 * front of it, identified by PIN instead.
 */
@Injectable()
export class AttendanceKioskService {
  private readonly pinLookupKey: Buffer;

  constructor(
    private readonly employees: AttendanceEmployeeRepository,
    private readonly records: AttendanceRecordRepository,
    private readonly attendance: AttendanceRecordService,
    config: AppConfigService,
  ) {
    // Derived once at construction (Nest instantiates providers eagerly),
    // same posture as MFA_ENCRYPTION_KEY/PAYMENT_METHOD_ENCRYPTION_KEY.
    this.pinLookupKey = deriveEncryptionKey(config.kioskPinLookupSecret, 'KIOSK_PIN_LOOKUP_SECRET');
  }

  listEmployees(tenantId: string): Promise<KioskEmployeeResponseDto[]> {
    return this.employees.listActiveForKiosk(tenantId);
  }

  async setPin(tenantId: string, employeeId: string, pin: string): Promise<void> {
    const clockInPinLookupHash = hashPinForLookup(pin, this.pinLookupKey);
    const taken = await this.employees.isPinLookupHashTaken(tenantId, clockInPinLookupHash, employeeId);
    if (taken) {
      throw new BadRequestException('This PIN is already used by another employee - choose a different one.');
    }

    const clockInPinHash = await argon2.hash(pin);
    await this.employees.setClockInPinHash(tenantId, employeeId, clockInPinHash, clockInPinLookupHash);
  }

  /**
   * Same generic "Incorrect PIN" message whether the employee has never set
   * a PIN or typed the wrong one - distinguishing the two at the kiosk UI
   * would let anyone standing at the device probe which employees have a
   * PIN configured at all.
   */
  async clock(tenantId: string, employeeId: string, pin: string): Promise<KioskClockResponseDto> {
    const employee = await this.employees.findByIdWithPin(tenantId, employeeId);
    const validPin = employee?.clockInPinHash ? await argon2.verify(employee.clockInPinHash, pin) : false;
    if (!validPin || !employee) {
      throw new UnauthorizedException('Incorrect PIN');
    }
    const employeeName = `${employee.firstName} ${employee.lastName}`;

    const openRecord = await this.records.findOpenByEmployee(tenantId, employeeId);
    if (openRecord) {
      const record = await this.attendance.clockOut(tenantId, employeeId);
      return { action: 'CLOCKED_OUT', employeeName, at: record.clockOut ?? new Date() };
    }

    const record = await this.attendance.clockIn(tenantId, employeeId);
    return { action: 'CLOCKED_IN', employeeName, at: record.clockIn ?? new Date() };
  }
}
