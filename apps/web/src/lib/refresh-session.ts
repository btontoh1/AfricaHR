import 'server-only';
import { cookies } from 'next/headers';
import { createBackendClient } from './backend-client';
import { REFRESH_TOKEN_COOKIE } from './session';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

/** Exchanges the httpOnly refresh-token cookie for a new token pair. Returns null if there's no refresh token or the backend rejects it (expired/revoked). */
export async function refreshSession(): Promise<RefreshResult | null> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return null;
  }

  const client = createBackendClient();
  const { data, error } = await client.POST('/api/auth/refresh', { body: { refreshToken } });
  if (error || !data) {
    return null;
  }
  return data;
}
