import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { AttendancePolicyRepository } from './attendance-policy.repository';
import { AttendanceRecordRepository } from './attendance-record.repository';
import { AttendanceEmployeeRepository } from './attendance-employee.repository';

@Module({
  imports: [PrismaModule],
  providers: [AttendancePolicyRepository, AttendanceRecordRepository, AttendanceEmployeeRepository],
  exports: [AttendancePolicyRepository, AttendanceRecordRepository, AttendanceEmployeeRepository],
})
export class AttendanceDataAccessModule {}
