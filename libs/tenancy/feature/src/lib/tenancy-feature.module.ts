import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { TenancyDataAccessModule } from '@africahr/tenancy-data-access';
import { TenantService } from './tenant.service';
import { OrganizationService } from './organization.service';
import { OrganizationUnitService } from './organization-unit.service';
import { TenantController } from './tenant.controller';
import { OrganizationController } from './organization.controller';
import { OrganizationUnitController } from './organization-unit.controller';

@Module({
  imports: [TenancyDataAccessModule, PlatformAuthModule, AuditModule],
  controllers: [TenantController, OrganizationController, OrganizationUnitController],
  providers: [TenantService, OrganizationService, OrganizationUnitService],
  exports: [TenantService, OrganizationService, OrganizationUnitService],
})
export class TenancyFeatureModule {}
