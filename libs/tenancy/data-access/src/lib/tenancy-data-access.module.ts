import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { TenantRepository } from './tenant.repository';
import { OrganizationRepository } from './organization.repository';
import { OrganizationUnitRepository } from './organization-unit.repository';

@Module({
  imports: [PrismaModule],
  providers: [TenantRepository, OrganizationRepository, OrganizationUnitRepository],
  exports: [TenantRepository, OrganizationRepository, OrganizationUnitRepository],
})
export class TenancyDataAccessModule {}
