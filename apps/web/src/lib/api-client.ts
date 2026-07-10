'use client';

import createClient from 'openapi-fetch';
import type { paths } from './api-types';

/**
 * Client-component-safe typed client. baseUrl is empty (same-origin) so
 * every call resolves to this app's own /api/* Route Handlers — the
 * catch-all at src/app/api/[...path]/route.ts — never the NestJS API
 * directly. The generated OpenAPI path strings (e.g.
 * "/api/tenants/{tenantId}/employees") match 1:1 because the proxy is
 * mounted at exactly /api/*, not /api/proxy/*.
 */
export const apiClient = createClient<paths>({ baseUrl: '' });
