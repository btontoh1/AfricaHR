import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendancePolicy } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { AttendancePolicyRepository } from '@africahr/attendance-data-access';
import { UpsertAttendancePolicyDto } from './dto/upsert-attendance-policy.dto';

@Injectable()
export class AttendancePolicyService {
  constructor(
    private readonly policies: AttendancePolicyRepository,
    private readonly audit: AuditService,
  ) {}

  async upsert(
    tenantId: string,
    dto: UpsertAttendancePolicyDto,
    actorId?: string,
  ): Promise<AttendancePolicy> {
    // The three geofence fields describe one center point + radius, so they
    // only make sense together - a full-replace upsert (like
    // standardDailyHours), so omitting all three clears any previously
    // configured geofence rather than leaving it untouched.
    const geofenceFields = [dto.geofenceLatitude, dto.geofenceLongitude, dto.geofenceRadiusMeters];
    const providedCount = geofenceFields.filter((field) => field !== undefined).length;
    if (providedCount > 0 && providedCount < 3) {
      throw new BadRequestException(
        'Set geofenceLatitude, geofenceLongitude, and geofenceRadiusMeters together to enable geofencing, or leave all three unset to disable it',
      );
    }

    const policy = await this.policies.upsert(tenantId, {
      standardDailyHours: dto.standardDailyHours,
      geofenceLatitude: dto.geofenceLatitude ?? null,
      geofenceLongitude: dto.geofenceLongitude ?? null,
      geofenceRadiusMeters: dto.geofenceRadiusMeters ?? null,
      actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.policy.upserted',
      resourceType: 'AttendancePolicy',
      resourceId: policy.id,
      metadata: { standardDailyHours: dto.standardDailyHours, geofenceConfigured: providedCount === 3 },
    });

    return policy;
  }

  async find(tenantId: string): Promise<AttendancePolicy> {
    const policy = await this.policies.find(tenantId);
    if (!policy) {
      throw new NotFoundException('No attendance policy configured for this tenant yet');
    }
    return policy;
  }
}
