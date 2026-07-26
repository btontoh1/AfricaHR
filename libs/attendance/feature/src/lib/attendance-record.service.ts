import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceRecord, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  AttendanceEmployeeRepository,
  AttendancePolicyRepository,
  AttendanceRecordRepository,
} from '@africahr/attendance-data-access';
import { computeHoursWorked, computeOvertimeHours, toCalendarDay } from '@africahr/attendance-domain';
import { CreateAttendanceRecordDto } from './dto/create-attendance-record.dto';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';

interface ComputedHours {
  hoursWorked?: number;
  overtimeHours?: number;
}

function translateReferenceError(error: unknown, employeeId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    throw new NotFoundException(`Employee "${employeeId}" not found`);
  }
  throw error;
}

@Injectable()
export class AttendanceRecordService {
  constructor(
    private readonly records: AttendanceRecordRepository,
    private readonly policies: AttendancePolicyRepository,
    private readonly employees: AttendanceEmployeeRepository,
    private readonly audit: AuditService,
  ) {}

  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async clockInForSelf(tenantId: string, userId: string): Promise<AttendanceRecord> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.clockIn(tenantId, employeeId, userId);
  }

  async clockIn(tenantId: string, employeeId: string, actorId?: string): Promise<AttendanceRecord> {
    const now = new Date();
    const date = toCalendarDay(now);

    const openRecord = await this.records.findOpenByEmployee(tenantId, employeeId);
    if (openRecord) {
      throw new ConflictException('Already clocked in — clock out before starting a new shift');
    }

    let record: AttendanceRecord;
    try {
      record = await this.records.create(tenantId, { employeeId, date, clockIn: now, createdBy: actorId });
    } catch (error) {
      translateReferenceError(error, employeeId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.clocked_in',
      resourceType: 'AttendanceRecord',
      resourceId: record.id,
    });

    return record;
  }

  async clockOutForSelf(tenantId: string, userId: string): Promise<AttendanceRecord> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.clockOut(tenantId, employeeId, userId);
  }

  async clockOut(tenantId: string, employeeId: string, actorId?: string): Promise<AttendanceRecord> {
    const now = new Date();

    const existing = await this.records.findOpenByEmployee(tenantId, employeeId);
    if (!existing || !existing.clockIn) {
      throw new ConflictException('Not currently clocked in');
    }

    const { hoursWorked, overtimeHours } = await this.computeHours(tenantId, existing.clockIn, now);

    const updated = await this.records.update(tenantId, existing.id, {
      clockOut: now,
      hoursWorked,
      overtimeHours,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.clocked_out',
      resourceType: 'AttendanceRecord',
      resourceId: existing.id,
      metadata: { hoursWorked, overtimeHours },
    });

    return updated;
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
      clockIn && clockOut ? await this.computeHours(tenantId, clockIn, clockOut) : {};

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

    return record;
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
        ? await this.computeHours(tenantId, clockIn, clockOut)
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

    return updated;
  }

  private async computeHours(tenantId: string, clockIn: Date, clockOut: Date): Promise<ComputedHours> {
    const hoursWorked = computeHoursWorked(clockIn, clockOut);
    const policy = await this.policies.find(tenantId);
    if (!policy) {
      throw new ConflictException(
        'No attendance policy configured for this tenant — set one before clocking out',
      );
    }
    const overtimeHours = computeOvertimeHours(hoursWorked, Number(policy.standardDailyHours));
    return { hoursWorked, overtimeHours };
  }
}
