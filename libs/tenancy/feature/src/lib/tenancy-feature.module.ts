import { Module } from '@nestjs/common';
import { TenancyDataAccessModule } from '@africahr/tenancy-data-access';
import { TenantService } from './tenant.service';
import { OrganizationService } from './organization.service';
import { OrganizationUnitService } from './organization-unit.service';

@Module({
  imports: [TenancyDataAccessModule],
  providers: [TenantService, OrganizationService, OrganizationUnitService],
  exports: [TenantService, OrganizationService, OrganizationUnitService],
})
export class TenancyFeatureModule {}
