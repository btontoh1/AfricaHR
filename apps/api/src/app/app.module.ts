import { Module } from '@nestjs/common';
import { CoreModule } from '@africahr/platform-core';
import { HealthModule } from '@africahr/platform-health';
import { IamFeatureModule } from '@africahr/iam-feature';
import { TenancyFeatureModule } from '@africahr/tenancy-feature';
import { EmployeeFeatureModule } from '@africahr/employee-feature';
import { PayrollFeatureModule } from '@africahr/payroll-feature';
import { LeaveFeatureModule } from '@africahr/leave-feature';
import { AttendanceFeatureModule } from '@africahr/attendance-feature';
import { BenefitsFeatureModule } from '@africahr/benefits-feature';
import { PerformanceFeatureModule } from '@africahr/performance-feature';
import { RecruitmentFeatureModule } from '@africahr/recruitment-feature';
import { ReportingFeatureModule } from '@africahr/reporting-feature';

@Module({
  imports: [
    CoreModule,
    HealthModule,
    IamFeatureModule,
    TenancyFeatureModule,
    EmployeeFeatureModule,
    PayrollFeatureModule,
    LeaveFeatureModule,
    AttendanceFeatureModule,
    BenefitsFeatureModule,
    PerformanceFeatureModule,
    RecruitmentFeatureModule,
    ReportingFeatureModule,
  ],
})
export class AppModule {}
