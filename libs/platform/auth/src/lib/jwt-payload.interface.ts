import { SystemRole } from './system-role';

export interface JwtPayload {
  /** User id */
  sub: string;
  email: string;
  role: SystemRole;
  /** null for platform admins */
  tenantId: string | null;
}

export interface RequestUser extends JwtPayload {
  /** JWT `iat`/`exp`, present once verified. */
  iat: number;
  exp: number;
}
