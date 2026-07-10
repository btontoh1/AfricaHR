import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { BenefitPlanRepository } from './benefit-plan.repository';
import { BenefitEnrollmentRepository } from './benefit-enrollment.repository';
import { BenefitsEmployeeRepository } from './benefits-employee.repository';

@Module({
  imports: [PrismaModule],
  providers: [BenefitPlanRepository, BenefitEnrollmentRepository, BenefitsEmployeeRepository],
  exports: [BenefitPlanRepository, BenefitEnrollmentRepository, BenefitsEmployeeRepository],
})
export class BenefitsDataAccessModule {}
