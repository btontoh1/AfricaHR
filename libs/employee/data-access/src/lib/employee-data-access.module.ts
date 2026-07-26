import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { EmployeeRepository } from './employee.repository';
import { EmploymentHistoryRepository } from './employment-history.repository';
import { PaymentMethodRepository } from './payment-method.repository';

@Module({
  imports: [PrismaModule],
  providers: [EmployeeRepository, EmploymentHistoryRepository, PaymentMethodRepository],
  exports: [EmployeeRepository, EmploymentHistoryRepository, PaymentMethodRepository],
})
export class EmployeeDataAccessModule {}
