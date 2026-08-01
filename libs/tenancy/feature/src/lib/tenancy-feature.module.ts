import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { PrismaModule } from '@africahr/platform-database';
import { RedisModule } from '@africahr/platform-redis';
import { StorageModule } from '@africahr/platform-storage';
import { TenancyDataAccessModule } from '@africahr/tenancy-data-access';
import { TenantService } from './tenant.service';
import { OrganizationService } from './organization.service';
import { OrganizationUnitService } from './organization-unit.service';
import { OrganizationVerificationDocumentService } from './organization-verification-document.service';
import { PlatformDashboardService } from './platform-dashboard.service';
import { TenantController } from './tenant.controller';
import { TenantPublicController } from './tenant-public.controller';
import { TenantMeController } from './tenant-me.controller';
import { OrganizationController } from './organization.controller';
import { OrganizationUnitController } from './organization-unit.controller';
import { OrganizationVerificationController } from './organization-verification.controller';
import { PlatformDashboardController } from './platform-dashboard.controller';

@Module({
  imports: [TenancyDataAccessModule, PlatformAuthModule, AuditModule, StorageModule, PrismaModule, RedisModule],
  // TenantMeController (tenants/me) must be registered before
  // TenantController (tenants/:id) so Nest's router matches the literal
  // "/me" segment before it's swallowed as an ":id" param.
  // TenantPublicController (tenants/public/:slug) doesn't collide with
  // anything (three segments vs. two), but is grouped here too since it's
  // the same kind of "more specific route" concern.
  // OrganizationVerificationController (organizations/verification-queue)
  // must be registered before OrganizationController
  // (tenants/:tenantId/organizations) so Nest's router doesn't need either
  // to disambiguate — they don't actually overlap (different first
  // segment), but this keeps the "more specific/platform routes first"
  // convention used elsewhere in this codebase (see recruitment-feature.module.ts).
  // PlatformDashboardController (platform-admin/dashboard) has a distinct
  // first segment too, so no ordering concern there either.
  controllers: [
    TenantPublicController,
    TenantMeController,
    TenantController,
    OrganizationVerificationController,
    OrganizationController,
    OrganizationUnitController,
    PlatformDashboardController,
  ],
  providers: [
    TenantService,
    OrganizationService,
    OrganizationUnitService,
    OrganizationVerificationDocumentService,
    PlatformDashboardService,
  ],
  exports: [TenantService, OrganizationService, OrganizationUnitService, OrganizationVerificationDocumentService],
})
export class TenancyFeatureModule {}
