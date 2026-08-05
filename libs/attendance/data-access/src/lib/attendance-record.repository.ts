import { Injectable } from '@nestjs/common';
import { AttendanceRecord, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateAttendanceRecordInput {
  employeeId: string;
  date: Date;
  clockIn?: Date | null;
  clockOut?: Date | null;
  hoursWorked?: Prisma.Decimal | number | null;
  overtimeHours?: Prisma.Decimal | number | null;
  notes?: string | null;
  clockInLatitude?: Prisma.Decimal | number | null;
  clockInLongitude?: Prisma.Decimal | number | null;
  clockInDistanceMeters?: number | null;
  clockInOutsideGeofence?: boolean | null;
  clockOutLatitude?: Prisma.Decimal | number | null;
  clockOutLongitude?: Prisma.Decimal | number | null;
  clockOutDistanceMeters?: number | null;
  clockOutOutsideGeofence?: boolean | null;
  createdBy?: string;
}

export interface UpdateAttendanceRecordInput {
  clockIn?: Date | null;
  clockOut?: Date | null;
  hoursWorked?: Prisma.Decimal | number | null;
  overtimeHours?: Prisma.Decimal | number | null;
  notes?: string | null;
  clockInLatitude?: Prisma.Decimal | number | null;
  clockInLongitude?: Prisma.Decimal | number | null;
  clockInDistanceMeters?: number | null;
  clockInOutsideGeofence?: boolean | null;
  clockOutLatitude?: Prisma.Decimal | number | null;
  clockOutLongitude?: Prisma.Decimal | number | null;
  clockOutDistanceMeters?: number | null;
  clockOutOutsideGeofence?: boolean | null;
  updatedBy?: string;
}

export interface ListAttendanceRecordsParams {
  employeeId?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class AttendanceRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateAttendanceRecordInput): Promise<AttendanceRecord> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceRecord.create({
        data: {
          tenantId,
          employeeId: input.employeeId,
          date: input.date,
          clockIn: input.clockIn,
          clockOut: input.clockOut,
          hoursWorked: input.hoursWorked,
          overtimeHours: input.overtimeHours,
          notes: input.notes,
          clockInLatitude: input.clockInLatitude,
          clockInLongitude: input.clockInLongitude,
          clockInDistanceMeters: input.clockInDistanceMeters,
          clockInOutsideGeofence: input.clockInOutsideGeofence,
          clockOutLatitude: input.clockOutLatitude,
          clockOutLongitude: input.clockOutLongitude,
          clockOutDistanceMeters: input.clockOutDistanceMeters,
          clockOutOutsideGeofence: input.clockOutOutsideGeofence,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<AttendanceRecord | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceRecord.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  /**
   * The employee's currently open record (clockOut IS NULL), regardless of
   * which calendar day it started on — clock-in/out must find this, not
   * "today's" record, or an overnight shift that crosses a UTC calendar-day
   * boundary between clock-in and clock-out would never find its own
   * still-open record.
   */
  findOpenByEmployee(tenantId: string, employeeId: string): Promise<AttendanceRecord | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceRecord.findFirst({
        where: { tenantId, employeeId, clockOut: null, deletedAt: null },
        orderBy: { date: 'desc' },
      }),
    );
  }

  list(tenantId: string, params: ListAttendanceRecordsParams = {}): Promise<AttendanceRecord[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceRecord.findMany({
        where: {
          tenantId,
          deletedAt: null,
          employeeId: params.employeeId,
          date:
            params.from || params.to
              ? { gte: params.from, lte: params.to }
              : undefined,
        },
        orderBy: { date: 'desc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateAttendanceRecordInput): Promise<AttendanceRecord> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceRecord.update({
        where: { id },
        data: {
          clockIn: input.clockIn,
          clockOut: input.clockOut,
          hoursWorked: input.hoursWorked,
          overtimeHours: input.overtimeHours,
          notes: input.notes,
          clockInLatitude: input.clockInLatitude,
          clockInLongitude: input.clockInLongitude,
          clockInDistanceMeters: input.clockInDistanceMeters,
          clockInOutsideGeofence: input.clockInOutsideGeofence,
          clockOutLatitude: input.clockOutLatitude,
          clockOutLongitude: input.clockOutLongitude,
          clockOutDistanceMeters: input.clockOutDistanceMeters,
          clockOutOutsideGeofence: input.clockOutOutsideGeofence,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
