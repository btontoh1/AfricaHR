import 'server-only';
import { createBackendClient } from './backend-client';

/** True when no tenant exists yet — used to gate the root page and /setup. */
export async function needsSetup(): Promise<boolean> {
  const client = createBackendClient();
  const { data } = await client.GET('/api/setup/status');
  return data?.needsSetup ?? false;
}
