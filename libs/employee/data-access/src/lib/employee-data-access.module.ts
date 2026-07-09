import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { EmployeeRepository } from './employee.repository';
import { EmploymentHistoryRepository } from './employment-history.repository';

@Module({
  imports: [PrismaModule],
  providers: [EmployeeRepository, EmploymentHistoryRepository],
  exports: [EmployeeRepository, EmploymentHistoryRepository],
})
export class EmployeeDataAccessModule {}
