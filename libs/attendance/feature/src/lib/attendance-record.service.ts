import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceRecord, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  AttendanceEmployeeRepository,
  AttendancePolicyRepository,
  AttendanceRecordRepository,
} from '@africahr/attendance-data-access';
import {
  computeHoursWorked,
  computeOvertimeHours,
  GeoPoint,
  haversineDistanceMeters,
  isOutsideGeofence,
  roundHours,
  toCalendarDay,
} from '@africahr/attendance-domain';
import { CreateAttendanceRecordDto } from './dto/create-attendance-record.dto';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';

interface ComputedHours {
  hoursWorked?: number;
  overtimeHours?: number;
}

interface GeofenceEvaluation {
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  outsideGeofence?: boolean;
}

function translateReferenceError(error: unknown, employeeId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    throw new NotFoundException(`Employee "${employeeId}" not found`);
  }
  throw error;
}

/**
 * Emitted only from the HR-manual create()/update() paths, not from
 * clockIn()/clockOut() - those are self-service and happen up to twice a
 * day per employee, so notifying on every clock event would be noise. A
 * manual create/edit is HR correcting or backfilling an employee's
 * record, which the employee genuinely benefits from knowing about.
 * Consumed by a listener living in notifications-feature - scope:attendance
 * is not allowed to depend on scope:notifications directly (see
 * eslint.config.mjs module boundaries), so this event is the decoupling
 * point between the two. Both sides must agree on this literal string and
 * payload shape informally; there's no shared type between scopes for it.
 */
export const ATTENDANCE_RECORD_ADJUSTED_EVENT = 'attendance.record.adjusted';

export interface AttendanceRecordAdjustedEvent {
  tenantId: string;
  employeeUserId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  action: 'created' | 'updated';
}

@Injectable()
export class AttendanceRecordService {
  constructor(
    private readonly records: AttendanceRecordRepository,
    private readonly policies: AttendancePolicyRepository,
    private readonly employees: AttendanceEmployeeRepository,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async clockInForSelf(tenantId: string, userId: string, position?: GeoPoint): Promise<AttendanceRecord> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.clockIn(tenantId, employeeId, userId, position);
  }

  async clockIn(
    tenantId: string,
    employeeId: string,
    actorId?: string,
    position?: GeoPoint,
  ): Promise<AttendanceRecord> {
    const now = new Date();
    const date = toCalendarDay(now);

    const openRecord = await this.records.findOpenByEmployee(tenantId, employeeId);
    if (openRecord) {
      throw new ConflictException('Already clocked in — clock out before starting a new shift');
    }

    const geofence = await this.evaluateGeofence(tenantId, position);

    let record: AttendanceRecord;
    try {
      record = await this.records.create(tenantId, {
        employeeId,
        date,
        clockIn: now,
        clockInLatitude: geofence.latitude,
        clockInLongitude: geofence.longitude,
        clockInDistanceMeters: geofence.distanceMeters,
        clockInOutsideGeofence: geofence.outsideGeofence,
        createdBy: actorId,
      });
    } catch (error) {
      translateReferenceError(error, employeeId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.clocked_in',
      resourceType: 'AttendanceRecord',
      resourceId: record.id,
      metadata: geofence.outsideGeofence !== undefined ? { outsideGeofence: geofence.outsideGeofence } : undefined,
    });

    return record;
  }

  async clockOutForSelf(tenantId: string, userId: string, position?: GeoPoint): Promise<AttendanceRecord> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.clockOut(tenantId, employeeId, userId, position);
  }

  async clockOut(
    tenantId: string,
    employeeId: string,
    actorId?: string,
    position?: GeoPoint,
  ): Promise<AttendanceRecord> {
    const now = new Date();

    const existing = await this.records.findOpenByEmployee(tenantId, employeeId);
    if (!existing || !existing.clockIn) {
      throw new ConflictException('Not currently clocked in');
    }

    const { hoursWorked, overtimeHours } = await this.computeHours(
      tenantId,
      employeeId,
      existing.date,
      existing.clockIn,
      now,
      existing.id,
    );

    const geofence = await this.evaluateGeofence(tenantId, position);

    const updated = await this.records.update(tenantId, existing.id, {
      clockOut: now,
      hoursWorked,
      overtimeHours,
      clockOutLatitude: geofence.latitude,
      clockOutLongitude: geofence.longitude,
      clockOutDistanceMeters: geofence.distanceMeters,
      clockOutOutsideGeofence: geofence.outsideGeofence,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.clocked_out',
      resourceType: 'AttendanceRecord',
      resourceId: existing.id,
      metadata: {
        hoursWorked,
        overtimeHours,
        ...(geofence.outsideGeofence !== undefined ? { outsideGeofence: geofence.outsideGeofence } : {}),
      },
    });

    return updated;
  }

  /**
   * Captures whatever GPS position the client sent, and - only if the
   * tenant has a geofence configured - judges it against that geofence.
   * Deliberately flag-only: an out-of-range result is never used to reject
   * the clock-in/out (see AttendancePolicy.geofenceLatitude doc comment),
   * so this never throws.
   */
  private async evaluateGeofence(tenantId: string, position?: GeoPoint): Promise<GeofenceEvaluation> {
    if (!position) {
      return {};
    }

    const policy = await this.policies.find(tenantId);
    if (!policy || policy.geofenceLatitude == null || policy.geofenceLongitude == null || policy.geofenceRadiusMeters == null) {
      return { latitude: position.latitude, longitude: position.longitude };
    }

    const distanceMeters = haversineDistanceMeters(position, {
      latitude: Number(policy.geofenceLatitude),
      longitude: Number(policy.geofenceLongitude),
    });

    return {
      latitude: position.latitude,
      longitude: position.longitude,
      distanceMeters,
      outsideGeofence: isOutsideGeofence(distanceMeters, policy.geofenceRadiusMeters),
    };
  }

  async findById(tenantId: string, id: string): Promise<AttendanceRecord> {
    const record = await this.records.findById(tenantId, id);
    if (!record) {
      throw new NotFoundException(`Attendance record "${id}" not found`);
    }
    return record;
  }

  list(
    tenantId: string,
    params: { employeeId?: string; from?: string; to?: string } = {},
  ): Promise<AttendanceRecord[]> {
    return this.records.list(tenantId, {
      employeeId: params.employeeId,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
    });
  }

  async listForSelf(
    tenantId: string,
    userId: string,
    params: { from?: string; to?: string } = {},
  ): Promise<AttendanceRecord[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.list(tenantId, { employeeId, ...params });
  }

  /** HR manual entry — corrections, or employees without app access. */
  async create(
    tenantId: string,
    dto: CreateAttendanceRecordDto,
    actorId?: string,
  ): Promise<AttendanceRecord> {
    const date = toCalendarDay(new Date(dto.date));
    const clockIn = dto.clockIn ? new Date(dto.clockIn) : undefined;
    const clockOut = dto.clockOut ? new Date(dto.clockOut) : undefined;

    const { hoursWorked, overtimeHours } =
      clockIn && clockOut
        ? await this.computeHours(tenantId, dto.employeeId, date, clockIn, clockOut)
        : {};

    let record: AttendanceRecord;
    try {
      record = await this.records.create(tenantId, {
        employeeId: dto.employeeId,
        date,
        clockIn,
        clockOut,
        hoursWorked,
        overtimeHours,
        notes: dto.notes,
        createdBy: actorId,
      });
    } catch (error) {
      translateReferenceError(error, dto.employeeId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.record.created',
      resourceType: 'AttendanceRecord',
      resourceId: record.id,
    });

    await this.notifyOfAdjustment(tenantId, record, 'created');

    return record;
  }

  /** Silent no-op if the employee can no longer be found or has no portal access. */
  private async notifyOfAdjustment(
    tenantId: string,
    record: AttendanceRecord,
    action: 'created' | 'updated',
  ): Promise<void> {
    const employee = await this.employees.findById(tenantId, record.employeeId);
    if (!employee?.userId) {
      return;
    }

    const event: AttendanceRecordAdjustedEvent = {
      tenantId,
      employeeUserId: employee.userId,
      date: record.date.toISOString().slice(0, 10),
      clockIn: record.clockIn?.toISOString() ?? null,
      clockOut: record.clockOut?.toISOString() ?? null,
      action,
    };
    this.eventEmitter.emit(ATTENDANCE_RECORD_ADJUSTED_EVENT, event);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAttendanceRecordDto,
    actorId?: string,
  ): Promise<AttendanceRecord> {
    const existing = await this.findById(tenantId, id);

    const clockIn = dto.clockIn ? new Date(dto.clockIn) : (existing.clockIn ?? undefined);
    const clockOut = dto.clockOut ? new Date(dto.clockOut) : (existing.clockOut ?? undefined);

    const { hoursWorked, overtimeHours } =
      clockIn && clockOut
        ? await this.computeHours(tenantId, existing.employeeId, existing.date, clockIn, clockOut, existing.id)
        : {
            hoursWorked: existing.hoursWorked ? Number(existing.hoursWorked) : undefined,
            overtimeHours: existing.overtimeHours ? Number(existing.overtimeHours) : undefined,
          };

    const updated = await this.records.update(tenantId, id, {
      clockIn,
      clockOut,
      hoursWorked,
      overtimeHours,
      notes: dto.notes,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.record.updated',
      resourceType: 'AttendanceRecord',
      resourceId: id,
    });

    await this.notifyOfAdjustment(tenantId, updated, 'updated');

    return updated;
  }

  /**
   * Overtime is cumulative across a day's multiple clock-in/out sessions: this
   * session's overtime is the *incremental* overtime added on top of whatever
   * hours the employee already logged that day (telescoping against the daily
   * threshold), not overtime computed against this session alone. That keeps
   * the sum of overtimeHours across a day's records equal to the true daily
   * total without having to rewrite any already-closed sibling records.
   */
  private async computeHours(
    tenantId: string,
    employeeId: string,
    date: Date,
    clockIn: Date,
    clockOut: Date,
    excludeRecordId?: string,
  ): Promise<ComputedHours> {
    const hoursWorked = computeHoursWorked(clockIn, clockOut);
    const policy = await this.policies.find(tenantId);
    if (!policy) {
      throw new ConflictException(
        'No attendance policy configured for this tenant — set one before clocking out',
      );
    }
    const standardDailyHours = Number(policy.standardDailyHours);

    const sameDayRecords = await this.records.list(tenantId, { employeeId, from: date, to: date });
    const priorHoursWorked = sameDayRecords
      .filter((r) => r.id !== excludeRecordId && r.hoursWorked != null)
      .reduce((sum, r) => sum + Number(r.hoursWorked), 0);

    const overtimeBefore = computeOvertimeHours(priorHoursWorked, standardDailyHours);
    const overtimeAfter = computeOvertimeHours(priorHoursWorked + hoursWorked, standardDailyHours);
    const overtimeHours = roundHours(overtimeAfter - overtimeBefore);

    return { hoursWorked, overtimeHours };
  }
}
