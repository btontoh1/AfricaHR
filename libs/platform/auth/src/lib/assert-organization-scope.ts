import { ForbiddenException } from '@nestjs/common';
import { RequestUser } from './jwt-payload.interface';
import { SystemRole } from './system-role';

/**
 * Every role except ORG_ADMIN is tenant-wide (assertTenantScope already
 * covers them). ORG_ADMIN is additionally scoped to exactly one
 * Organization - call this wherever a route or service is about to act on
 * a specific organizationId, alongside (not instead of) assertTenantScope.
 */
export function assertOrganizationScope(actor: RequestUser, organizationId: string): void {
  if (actor.role !== SystemRole.ORG_ADMIN) {
    return;
  }
  if (actor.organizationId !== organizationId) {
    throw new ForbiddenException('Cannot act on a different organization');
  }
}
