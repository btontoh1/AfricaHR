import { Injectable, NotFoundException } from '@nestjs/common';
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
    const policy = await this.policies.upsert(tenantId, {
      standardDailyHours: dto.standardDailyHours,
      actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'attendance.policy.upserted',
      resourceType: 'AttendancePolicy',
      resourceId: policy.id,
      metadata: { standardDailyHours: dto.standardDailyHours },
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
