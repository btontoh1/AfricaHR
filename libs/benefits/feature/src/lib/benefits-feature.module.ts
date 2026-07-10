import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { BenefitsDataAccessModule } from '@africahr/benefits-data-access';
import { BenefitPlanService } from './benefit-plan.service';
import { BenefitPlanController } from './benefit-plan.controller';
import { BenefitEnrollmentService } from './benefit-enrollment.service';
import { MyBenefitEnrollmentController } from './my-benefit-enrollment.controller';
import { BenefitEnrollmentController } from './benefit-enrollment.controller';

@Module({
  imports: [BenefitsDataAccessModule, PlatformAuthModule, AuditModule],
  // MyBenefitEnrollmentController (literal "/me" path) must be registered
  // before BenefitEnrollmentController (dynamic "/:id" path) so Nest's
  // router matches "/me" as the literal segment, not as :id="me".
  controllers: [BenefitPlanController, MyBenefitEnrollmentController, BenefitEnrollmentController],
  providers: [BenefitPlanService, BenefitEnrollmentService],
  exports: [BenefitPlanService, BenefitEnrollmentService],
})
export class BenefitsFeatureModule {}
