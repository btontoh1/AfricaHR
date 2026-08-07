import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { EmployeeRepository } from './employee.repository';
import { EmploymentHistoryRepository } from './employment-history.repository';
import { FamilyMemberRepository } from './family-member.repository';
import { PaymentMethodRepository } from './payment-method.repository';
import { UserAccessRepository } from './user-access.repository';

@Module({
  imports: [PrismaModule, PlatformAuthModule],
  providers: [
    EmployeeRepository,
    EmploymentHistoryRepository,
    FamilyMemberRepository,
    PaymentMethodRepository,
    UserAccessRepository,
  ],
  exports: [
    EmployeeRepository,
    EmploymentHistoryRepository,
    FamilyMemberRepository,
    PaymentMethodRepository,
    UserAccessRepository,
  ],
})
export class EmployeeDataAccessModule {}
