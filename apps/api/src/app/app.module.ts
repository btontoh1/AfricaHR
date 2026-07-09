import { Module } from '@nestjs/common';
import { CoreModule } from '@africahr/platform-core';
import { HealthModule } from '@africahr/platform-health';
import { IamFeatureModule } from '@africahr/iam-feature';
import { TenancyFeatureModule } from '@africahr/tenancy-feature';
import { EmployeeFeatureModule } from '@africahr/employee-feature';
import { PayrollFeatureModule } from '@africahr/payroll-feature';
import { LeaveFeatureModule } from '@africahr/leave-feature';

@Module({
  imports: [
    CoreModule,
    HealthModule,
    IamFeatureModule,
    TenancyFeatureModule,
    EmployeeFeatureModule,
    PayrollFeatureModule,
    LeaveFeatureModule,
  ],
})
export class AppModule {}
