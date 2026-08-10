import 'server-only';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { ACCESS_TOKEN_COOKIE } from './auth-cookie-names';

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth-cookie-names';

// Matches the backend's RequestUser JWT payload shape exactly
// (libs/platform/auth/src/lib/jwt-payload.interface.ts). Decoded here for
// display purposes only (name/role/tenant in the UI) — every real
// authorization decision still happens against the backend on each
// request via the proxy route, so an unverified decode is safe: a forged
// token would simply fail the backend's own signature check downstream.
export interface SessionUser {
  sub: string;
  email: string;
  role: 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'HR_MANAGER' | 'PAYROLL_MANAGER' | 'ORG_ADMIN' | 'EMPLOYEE';
  tenantId: string | null;
  organizationId: string | null;
  iat: number;
  exp: number;
}

export function decodeAccessToken(token: string): SessionUser | null {
  try {
    return decodeJwt(token) as SessionUser;
  } catch {
    return null;
  }
}

/** Server Components / Route Handlers only — reads the httpOnly cookie directly. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return decodeAccessToken(token);
}
