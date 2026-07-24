import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { TenantRepository } from './tenant.repository';
import { OrganizationRepository } from './organization.repository';
import { OrganizationUnitRepository } from './organization-unit.repository';
import { OrganizationVerificationDocumentRepository } from './organization-verification-document.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    TenantRepository,
    OrganizationRepository,
    OrganizationUnitRepository,
    OrganizationVerificationDocumentRepository,
  ],
  exports: [
    TenantRepository,
    OrganizationRepository,
    OrganizationUnitRepository,
    OrganizationVerificationDocumentRepository,
  ],
})
export class TenancyDataAccessModule {}
