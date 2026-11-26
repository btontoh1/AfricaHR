import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { PolicyRepository } from './policy.repository';
import { PolicyAcknowledgementRepository } from './policy-acknowledgement.repository';
import { IntranetEmployeeRepository } from './intranet-employee.repository';

@Module({
  imports: [PrismaModule],
  providers: [PolicyRepository, PolicyAcknowledgementRepository, IntranetEmployeeRepository],
  exports: [PolicyRepository, PolicyAcknowledgementRepository, IntranetEmployeeRepository],
})
export class IntranetDataAccessModule {}
