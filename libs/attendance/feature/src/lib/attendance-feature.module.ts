import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { AppConfigModule } from '@africahr/platform-core';
import { AttendanceDataAccessModule } from '@africahr/attendance-data-access';
import { AttendancePolicyService } from './attendance-policy.service';
import { AttendancePolicyController } from './attendance-policy.controller';
import { AttendanceRecordService } from './attendance-record.service';
import { MyAttendanceController } from './my-attendance.controller';
import { AttendanceController } from './attendance.controller';
import { AttendanceLocationService } from './attendance-location.service';
import { AttendanceLocationController } from './attendance-location.controller';
import { AttendanceKioskService } from './attendance-kiosk.service';
import { AttendanceKioskController } from './attendance-kiosk.controller';

@Module({
  imports: [AttendanceDataAccessModule, PlatformAuthModule, AuditModule, AppConfigModule],
  // MyAttendanceController (literal "/me" path) and AttendanceKioskController
  // (literal "/kiosk" path) must both be registered before AttendanceController
  // (dynamic "/:id" path) so Nest's router matches those literal segments
  // before falling through to :id="me" or :id="kiosk".
  controllers: [
    AttendancePolicyController,
    AttendanceLocationController,
    MyAttendanceController,
    AttendanceKioskController,
    AttendanceController,
  ],
  providers: [AttendancePolicyService, AttendanceRecordService, AttendanceLocationService, AttendanceKioskService],
  exports: [AttendancePolicyService, AttendanceRecordService, AttendanceLocationService, AttendanceKioskService],
})
export class AttendanceFeatureModule {}
