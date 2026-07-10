import 'server-only';
import createClient from 'openapi-fetch';
import type { paths } from './api-types';

// The generated OpenAPI path strings already carry the backend's own
// "/api" global prefix (e.g. "/api/auth/login"), so the client's baseUrl
// must be the bare origin — API_BASE_URL itself includes "/api" (the
// generic proxy route in src/app/api/[...path]/route.ts needs it that
// way, since its captured path segments don't include "/api"), so it's
// stripped here specifically for this typed client.
const API_ORIGIN = process.env.API_BASE_URL?.replace(/\/api\/?$/, '');

/**
 * Server-only typed client for the NestJS API — used exclusively inside
 * Route Handlers (never imported by client components, enforced by the
 * `server-only` guard above). The browser never talks to the backend
 * directly; every request goes through this app's own /api/* routes,
 * which attach the httpOnly-cookie-stored access token here.
 */
export function createBackendClient(accessToken?: string) {
  return createClient<paths>({
    baseUrl: API_ORIGIN,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}
