import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { LeaveDataAccessModule } from '@africahr/leave-data-access';
import { LeaveTypeService } from './leave-type.service';
import { LeaveTypeController } from './leave-type.controller';
import { LeaveRequestService } from './leave-request.service';
import { MyLeaveRequestController } from './my-leave-request.controller';
import { MyLeaveBalanceController } from './my-leave-balance.controller';
import { TeamLeaveRequestController } from './team-leave-request.controller';
import { LeaveRequestController } from './leave-request.controller';

@Module({
  imports: [LeaveDataAccessModule, PlatformAuthModule, AuditModule],
  // MyLeaveRequestController ("/me") and TeamLeaveRequestController
  // ("/team") are literal-path segments that must be registered before
  // LeaveRequestController's dynamic "/:id" route, or Nest's router would
  // match "/me"/"/team" as :id instead. MyLeaveBalanceController lives
  // under its own "leave-balances" prefix, so it doesn't share that
  // ordering concern.
  controllers: [
    LeaveTypeController,
    MyLeaveRequestController,
    MyLeaveBalanceController,
    TeamLeaveRequestController,
    LeaveRequestController,
  ],
  providers: [LeaveTypeService, LeaveRequestService],
  exports: [LeaveTypeService, LeaveRequestService],
})
export class LeaveFeatureModule {}
