import { Module } from '@nestjs/common';
import { IamFeatureModule } from '@africahr/iam-feature';
import { IamDataAccessModule } from '@africahr/iam-data-access';
import { TenancyFeatureModule } from '@africahr/tenancy-feature';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';

@Module({
  imports: [TenancyFeatureModule, IamFeatureModule, IamDataAccessModule],
  controllers: [SetupController],
  providers: [SetupService],
})
export class SetupModule {}
