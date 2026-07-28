import 'server-only';
import { NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './session';
import { DEVICE_TOKEN_COOKIE } from './auth-cookie-names';

// Mirrors the backend's own token lifetimes exactly (see
// libs/platform/auth/src/lib/jwt-token.service.ts and
// libs/iam/feature/src/lib/auth.service.ts) so a cookie never outlives
// the token it holds.
const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
// Mirrors MfaService's TRUSTED_DEVICE_TTL_DAYS.
const DEVICE_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Deliberately not part of setAuthCookies/clearAuthCookies above - a
 * device token is independent of the session (it survives logout; only
 * "forget this device" or disabling MFA should remove it).
 */
export function setDeviceTokenCookie(response: NextResponse, deviceToken: string): void {
  response.cookies.set(DEVICE_TOKEN_COOKIE, deviceToken, {
    ...baseCookieOptions,
    maxAge: DEVICE_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearDeviceTokenCookie(response: NextResponse): void {
  response.cookies.delete(DEVICE_TOKEN_COOKIE);
}
