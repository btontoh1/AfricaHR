import { ForbiddenException } from '@nestjs/common';
import { RequestUser } from './jwt-payload.interface';
import { SystemRole } from './system-role';

/**
 * Platform admins may act on any tenant; everyone else may only act on
 * their own. Call this at the top of any tenant-nested route handler.
 */
export function assertTenantScope(actor: RequestUser, tenantId: string): void {
  if (actor.role === SystemRole.PLATFORM_ADMIN) {
    return;
  }
  if (actor.tenantId !== tenantId) {
    throw new ForbiddenException('Cannot act on a different tenant');
  }
}
