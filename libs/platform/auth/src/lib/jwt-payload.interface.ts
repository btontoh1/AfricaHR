import { SystemRole } from './system-role';

export interface JwtPayload {
  /** User id */
  sub: string;
  email: string;
  role: SystemRole;
  /** null for platform admins */
  tenantId: string | null;
  /** Set only for ORG_ADMIN; null for every other role. */
  organizationId: string | null;
  /**
   * Present only on an impersonation token (see JwtTokenService.
   * signImpersonationToken) - names the platform admin actually driving
   * this session, per RFC 8693's "act" (actor) claim pattern. `sub` above
   * stays the impersonated user's own id so every tenant-scoping/
   * permission check in the app runs exactly as it would for that user -
   * this claim is metadata for the audit trail and the UI banner, not an
   * input to any authorization decision. JwtAuthGuard uses its mere
   * presence to force the session read-only (see that guard).
   */
  act?: { sub: string; email: string };
}

export interface RequestUser extends JwtPayload {
  /** JWT `iat`/`exp`, present once verified. */
  iat: number;
  exp: number;
}
