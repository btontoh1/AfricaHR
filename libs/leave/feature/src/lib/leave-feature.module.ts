import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { LeaveDataAccessModule } from '@africahr/leave-data-access';
import { LeaveTypeService } from './leave-type.service';
import { LeaveTypeController } from './leave-type.controller';
import { LeaveRequestService } from './leave-request.service';
import { MyLeaveRequestController } from './my-leave-request.controller';
import { LeaveRequestController } from './leave-request.controller';

@Module({
  imports: [LeaveDataAccessModule, PlatformAuthModule, AuditModule],
  // MyLeaveRequestController (literal "/me" path) must be registered
  // before LeaveRequestController (dynamic "/:id" path) so Nest's router
  // matches "/me" as the literal segment, not as :id="me".
  controllers: [LeaveTypeController, MyLeaveRequestController, LeaveRequestController],
  providers: [LeaveTypeService, LeaveRequestService],
  exports: [LeaveTypeService, LeaveRequestService],
})
export class LeaveFeatureModule {}
