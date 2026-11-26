import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { PolicyRepository } from './policy.repository';
import { PolicyAcknowledgementRepository } from './policy-acknowledgement.repository';
import { AnnouncementRepository } from './announcement.repository';
import { AnnouncementReadRepository } from './announcement-read.repository';
import { IntranetEmployeeRepository } from './intranet-employee.repository';

const PROVIDERS = [
  PolicyRepository,
  PolicyAcknowledgementRepository,
  AnnouncementRepository,
  AnnouncementReadRepository,
  IntranetEmployeeRepository,
];

@Module({
  imports: [PrismaModule],
  providers: PROVIDERS,
  exports: PROVIDERS,
})
export class IntranetDataAccessModule {}
