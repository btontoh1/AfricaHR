// No `next/headers` or `server-only` import here on purpose — this is pure
// enough to unit-test directly (see refresh-session.ts, which is the one
// caller and can't be tested the same way because it needs cookies()).
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Collapses concurrent calls sharing the same key into a single underlying
 * call, so every caller gets the same result instead of each triggering
 * its own.
 *
 * Written for refreshSession(): the backend rotates refresh tokens on use
 * (single-use, revoked immediately - see AuthService.refresh), so if two
 * requests both hit an expired access token at the same moment and each
 * independently POSTed /api/auth/refresh with the same refresh-token
 * cookie, only the first would succeed - the second's refresh would fail
 * against an already-revoked token and clear both auth cookies, which can
 * stomp the first request's freshly-set valid session depending on
 * response arrival order. Keying by the refresh token itself means both
 * requests await the one real call and both come away with the same new
 * token pair, so neither one clears anything.
 */
export function dedupeInFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}
