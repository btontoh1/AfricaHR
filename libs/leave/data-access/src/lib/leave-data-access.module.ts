import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { LeaveTypeRepository } from './leave-type.repository';
import { LeaveBalanceRepository } from './leave-balance.repository';
import { LeaveRequestRepository } from './leave-request.repository';
import { LeaveEmployeeRepository } from './leave-employee.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    LeaveTypeRepository,
    LeaveBalanceRepository,
    LeaveRequestRepository,
    LeaveEmployeeRepository,
  ],
  exports: [
    LeaveTypeRepository,
    LeaveBalanceRepository,
    LeaveRequestRepository,
    LeaveEmployeeRepository,
  ],
})
export class LeaveDataAccessModule {}
