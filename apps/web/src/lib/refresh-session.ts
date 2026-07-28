import 'server-only';
import { cookies } from 'next/headers';
import { createBackendClient } from './backend-client';
import { dedupeInFlight } from './dedupe-in-flight';
import { REFRESH_TOKEN_COOKIE } from './session';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

async function performRefresh(refreshToken: string): Promise<RefreshResult | null> {
  const client = createBackendClient();
  const { data, error } = await client.POST('/api/auth/refresh', { body: { refreshToken } });
  if (error || !data) {
    return null;
  }
  return data;
}

/**
 * Exchanges the httpOnly refresh-token cookie for a new token pair. Returns
 * null if there's no refresh token or the backend rejects it
 * (expired/revoked).
 *
 * Concurrent calls sharing the same refresh-token cookie value are
 * collapsed into a single backend call via dedupeInFlight - see that
 * module's doc comment for why (the backend's single-use rotation means a
 * second independent call with the same token would otherwise fail and
 * clear a session that the first call had just made valid).
 */
export async function refreshSession(): Promise<RefreshResult | null> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return null;
  }

  return dedupeInFlight(refreshToken, () => performRefresh(refreshToken));
}
