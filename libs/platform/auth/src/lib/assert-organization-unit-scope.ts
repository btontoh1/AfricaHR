import { ForbiddenException } from '@nestjs/common';
import { RequestUser } from './jwt-payload.interface';
import { SystemRole } from './system-role';

/**
 * Every role except UNIT_ADMIN is unscoped by OrganizationUnit (most are
 * tenant-wide via assertTenantScope; ORG_ADMIN is scoped to a whole
 * Organization via assertOrganizationScope instead). UNIT_ADMIN is
 * additionally scoped to exactly one OrganizationUnit - call this wherever
 * a route or service is about to act on a specific organizationUnitId,
 * alongside (not instead of) assertTenantScope/assertOrganizationScope.
 */
export function assertOrganizationUnitScope(actor: RequestUser, organizationUnitId: string): void {
  if (actor.role !== SystemRole.UNIT_ADMIN) {
    return;
  }
  if (actor.organizationUnitId !== organizationUnitId) {
    throw new ForbiddenException('Cannot act on a different organization unit');
  }
}
