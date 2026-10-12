import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { AttendanceDataAccessModule } from '@africahr/attendance-data-access';
import { AttendancePolicyService } from './attendance-policy.service';
import { AttendancePolicyController } from './attendance-policy.controller';
import { AttendanceRecordService } from './attendance-record.service';
import { MyAttendanceController } from './my-attendance.controller';
import { AttendanceController } from './attendance.controller';
import { AttendanceLocationService } from './attendance-location.service';
import { AttendanceLocationController } from './attendance-location.controller';

@Module({
  imports: [AttendanceDataAccessModule, PlatformAuthModule, AuditModule],
  // MyAttendanceController (literal "/me" path) must be registered before
  // AttendanceController (dynamic "/:id" path) so Nest's router matches
  // "/me" as the literal segment, not as :id="me".
  controllers: [
    AttendancePolicyController,
    AttendanceLocationController,
    MyAttendanceController,
    AttendanceController,
  ],
  providers: [AttendancePolicyService, AttendanceRecordService, AttendanceLocationService],
  exports: [AttendancePolicyService, AttendanceRecordService, AttendanceLocationService],
})
export class AttendanceFeatureModule {}
