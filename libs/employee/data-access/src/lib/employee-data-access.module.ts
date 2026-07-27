import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { EmployeeRepository } from './employee.repository';
import { EmploymentHistoryRepository } from './employment-history.repository';
import { PaymentMethodRepository } from './payment-method.repository';
import { UserAccessRepository } from './user-access.repository';

@Module({
  imports: [PrismaModule],
  providers: [EmployeeRepository, EmploymentHistoryRepository, PaymentMethodRepository, UserAccessRepository],
  exports: [EmployeeRepository, EmploymentHistoryRepository, PaymentMethodRepository, UserAccessRepository],
})
export class EmployeeDataAccessModule {}
