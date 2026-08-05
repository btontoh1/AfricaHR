import { Injectable } from '@nestjs/common';
import { AttendancePolicy, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface UpsertAttendancePolicyInput {
  standardDailyHours: Prisma.Decimal | number;
  /** All three geofence fields travel together - null clears geofencing (see AttendancePolicyService). */
  geofenceLatitude?: Prisma.Decimal | number | null;
  geofenceLongitude?: Prisma.Decimal | number | null;
  geofenceRadiusMeters?: number | null;
  actorId?: string;
}

@Injectable()
export class AttendancePolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One policy per tenant — upserts on the tenant's single row. */
  upsert(tenantId: string, input: UpsertAttendancePolicyInput): Promise<AttendancePolicy> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendancePolicy.upsert({
        where: { tenantId },
        create: {
          tenantId,
          standardDailyHours: input.standardDailyHours,
          geofenceLatitude: input.geofenceLatitude,
          geofenceLongitude: input.geofenceLongitude,
          geofenceRadiusMeters: input.geofenceRadiusMeters,
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
        update: {
          standardDailyHours: input.standardDailyHours,
          geofenceLatitude: input.geofenceLatitude,
          geofenceLongitude: input.geofenceLongitude,
          geofenceRadiusMeters: input.geofenceRadiusMeters,
          updatedBy: input.actorId,
        },
      }),
    );
  }

  find(tenantId: string): Promise<AttendancePolicy | null> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.attendancePolicy.findUnique({ where: { tenantId } }));
  }
}
