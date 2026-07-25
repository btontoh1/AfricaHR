import { Module } from '@nestjs/common';
import { IamFeatureModule } from '@africahr/iam-feature';
import { IamDataAccessModule } from '@africahr/iam-data-access';
import { TenancyFeatureModule } from '@africahr/tenancy-feature';
import { TenantAuthController } from './tenant-auth.controller';
import { TenantAuthService } from './tenant-auth.service';

@Module({
  imports: [TenancyFeatureModule, IamFeatureModule, IamDataAccessModule],
  controllers: [TenantAuthController],
  providers: [TenantAuthService],
})
export class TenantAuthModule {}
