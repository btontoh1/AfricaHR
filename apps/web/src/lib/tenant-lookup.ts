import 'server-only';
import { createBackendClient } from './backend-client';

export interface PublicTenant {
  name: string;
  slug: string;
}

/** Resolves a tenant's public display info by slug, for org-scoped login. Null if unknown/suspended/closed. */
export async function getTenantBySlug(slug: string): Promise<PublicTenant | null> {
  const client = createBackendClient();
  const { data } = await client.GET('/api/tenants/public/{slug}', { params: { path: { slug } } });
  return data ?? null;
}
