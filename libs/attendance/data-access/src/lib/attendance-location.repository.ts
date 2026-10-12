import { Injectable } from '@nestjs/common';
import { AttendanceLocation, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateAttendanceLocationInput {
  name: string;
  latitude: Prisma.Decimal | number;
  longitude: Prisma.Decimal | number;
  radiusMeters: number;
  actorId?: string;
}

export interface UpdateAttendanceLocationInput {
  name?: string;
  latitude?: Prisma.Decimal | number;
  longitude?: Prisma.Decimal | number;
  radiusMeters?: number;
  actorId?: string;
}

@Injectable()
export class AttendanceLocationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateAttendanceLocationInput): Promise<AttendanceLocation> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceLocation.create({
        data: {
          tenantId,
          name: input.name,
          latitude: input.latitude,
          longitude: input.longitude,
          radiusMeters: input.radiusMeters,
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateAttendanceLocationInput): Promise<AttendanceLocation> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceLocation.update({
        where: { id },
        data: {
          name: input.name,
          latitude: input.latitude,
          longitude: input.longitude,
          radiusMeters: input.radiusMeters,
          updatedBy: input.actorId,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<AttendanceLocation | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceLocation.findFirst({ where: { id, tenantId } }),
    );
  }

  list(tenantId: string): Promise<AttendanceLocation[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceLocation.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
    );
  }

  /** Hard delete — locations carry no history of their own (see AttendanceRecord's denormalized location-name snapshot). */
  delete(tenantId: string, id: string): Promise<AttendanceLocation> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.attendanceLocation.delete({ where: { id } }));
  }
}
