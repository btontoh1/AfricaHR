'use client';

import { usePolicyAcknowledgements } from './queries';

export function PolicyAcknowledgementsList({ tenantId, policyId }: { tenantId: string; policyId: string }) {
  const { data: acknowledgements, isLoading } = usePolicyAcknowledgements(tenantId, policyId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading read receipts…</p>;
  }

  if (!acknowledgements || acknowledgements.length === 0) {
    return <p className="text-sm text-muted-foreground">No one has acknowledged this policy yet.</p>;
  }

  return (
    <ul className="space-y-1">
      {acknowledgements.map((ack) => (
        <li key={ack.employeeId} className="text-sm">
          {ack.firstName} {ack.lastName}{' '}
          <span className="text-muted-foreground">— read {new Date(ack.readAt).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}
