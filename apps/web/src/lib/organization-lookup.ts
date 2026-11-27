import 'server-only';
import { createBackendClient } from './backend-client';

export interface PublicOrganization {
  name: string;
  slug: string;
}

/** Resolves an organization's public display info by slug, for its own sign-in link. Null if unknown or its tenant isn't resolvable. */
export async function getOrganizationBySlug(
  tenantSlug: string,
  orgSlug: string,
): Promise<PublicOrganization | null> {
  const client = createBackendClient();
  const { data } = await client.GET('/api/tenants/public/{tenantSlug}/organizations/{orgSlug}', {
    params: { path: { tenantSlug, orgSlug } },
  });
  return data ?? null;
}
