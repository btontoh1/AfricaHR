import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { EmployeeDataAccessModule } from '@africahr/employee-data-access';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { PaymentMethodService } from './payment-method.service';
import { MyPaymentMethodController } from './my-payment-method.controller';

@Module({
  imports: [EmployeeDataAccessModule, PlatformAuthModule, AuditModule],
  controllers: [EmployeeController, MyPaymentMethodController],
  providers: [EmployeeService, PaymentMethodService],
  exports: [EmployeeService, PaymentMethodService],
})
export class EmployeeFeatureModule {}
