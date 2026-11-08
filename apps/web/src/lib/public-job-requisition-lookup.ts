import 'server-only';
import { createBackendClient } from './backend-client';
import type { components } from './api-types';

export type PublicJobRequisition = components['schemas']['PublicJobRequisitionResponseDto'];

/** Resolves a job posting's public details by id, for the careers page. Null if unknown/not open. */
export async function getPublicJobRequisition(requisitionId: string): Promise<PublicJobRequisition | null> {
  const client = createBackendClient();
  const { data } = await client.GET('/api/public/job-requisitions/{id}', {
    params: { path: { id: requisitionId } },
  });
  return data ?? null;
}
