import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceLocation } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { AttendanceLocationRepository } from '@africahr/attendance-data-access';
import { CreateAttendanceLocationDto } from './dto/create-attendance-location.dto';
import { UpdateAttendanceLocationDto } from './dto/update-attendance-location.dto';

@Injectable()
export class AttendanceLocationService {
  constructor(
    private readonly locations: AttendanceLocationRepository,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string): Promise<AttendanceLocation[]> {
    return this.locations.list(tenantId);
  }

  async create(
    tenantId: string,
    dto: CreateAttendanceLocationDto,
    actorId?: string,
  ): Promise<AttendanceLocation> {
    const location = await this.locations.create(tenantId, { ...dto, actorId });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.location.created',
      resourceType: 'AttendanceLocation',
      resourceId: location.id,
    });

    return location;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAttendanceLocationDto,
    actorId?: string,
  ): Promise<AttendanceLocation> {
    await this.findById(tenantId, id);

    const location = await this.locations.update(tenantId, id, { ...dto, actorId });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.location.updated',
      resourceType: 'AttendanceLocation',
      resourceId: id,
    });

    return location;
  }

  async delete(tenantId: string, id: string, actorId?: string): Promise<void> {
    await this.findById(tenantId, id);

    await this.locations.delete(tenantId, id);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.location.deleted',
      resourceType: 'AttendanceLocation',
      resourceId: id,
    });
  }

  async findById(tenantId: string, id: string): Promise<AttendanceLocation> {
    const location = await this.locations.findById(tenantId, id);
    if (!location) {
      throw new NotFoundException(`Attendance location "${id}" not found`);
    }
    return location;
  }
}
