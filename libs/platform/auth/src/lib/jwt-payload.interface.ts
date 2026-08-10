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
}

export interface RequestUser extends JwtPayload {
  /** JWT `iat`/`exp`, present once verified. */
  iat: number;
  exp: number;
}
