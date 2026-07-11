import axios, { AxiosInstance } from 'axios';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Logs in with retry-with-backoff on 429 - the login endpoint is
 * intentionally throttled to 5/min per IP, and this suite's fixture
 * bootstrap plus several spec files each need their own logins against
 * the same shared server. The auth-lifecycle spec's own throttle test
 * calls axios directly instead, since it wants to observe the 429
 * rather than have it masked by a retry.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await axios.post('/api/auth/login', { email, password }, { validateStatus: () => true });
    if (response.status === 200) {
      return response.data;
    }
    if (response.status === 429) {
      await sleep(5000);
      continue;
    }
    throw new Error(`login failed for ${email}: ${response.status} ${JSON.stringify(response.data)}`);
  }
  throw new Error(`login for ${email} kept 429ing`);
}

/** An axios instance with the bearer token pre-attached. */
export function asUser(accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: axios.defaults.baseURL,
    headers: { Authorization: `Bearer ${accessToken}` },
    validateStatus: () => true,
  });
}
