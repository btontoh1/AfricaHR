import { Module } from '@nestjs/common';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { EmployeeDataAccessModule } from '@africahr/employee-data-access';
import { EmployeeService } from './employee.service';
import { EmployeeBulkImportService } from './employee-bulk-import.service';
import { EmployeeController } from './employee.controller';
import { PaymentMethodService } from './payment-method.service';
import { MyPaymentMethodController } from './my-payment-method.controller';
import { LogPaystackBankClient, PaystackBankClient, RealPaystackBankClient } from './paystack-bank-client';

@Module({
  imports: [EmployeeDataAccessModule, PlatformAuthModule, AuditModule, AppConfigModule],
  controllers: [EmployeeController, MyPaymentMethodController],
  providers: [
    EmployeeService,
    EmployeeBulkImportService,
    PaymentMethodService,
    {
      provide: PaystackBankClient,
      inject: [AppConfigService],
      // Real bank lookup only when PAYSTACK_SECRET_KEY is set - falls
      // back to a small illustrative list otherwise (local/dev/CI), same
      // posture as billing's PaystackClient/payroll's PaystackTransferClient.
      useFactory: (config: AppConfigService) => {
        const secretKey = config.paystackSecretKey;
        return secretKey ? new RealPaystackBankClient(secretKey) : new LogPaystackBankClient();
      },
    },
  ],
  exports: [EmployeeService, PaymentMethodService],
})
export class EmployeeFeatureModule {}
