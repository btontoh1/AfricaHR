'use client';

import { toast } from 'sonner';
import { FileStack } from 'lucide-react';
import { useMyPolicies, useMyPolicyViewUrl, useAcknowledgePolicy } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import type { Policy } from './types';

function groupByFolder(policies: Policy[]): [string, Policy[]][] {
  const groups = new Map<string, Policy[]>();
  for (const policy of policies) {
    const group = groups.get(policy.folder);
    if (group) {
      group.push(policy);
    } else {
      groups.set(policy.folder, [policy]);
    }
  }
  return [...groups.entries()];
}

export function MyPoliciesList({ tenantId }: { tenantId: string }) {
  const { data: policies, isLoading, isError, error } = useMyPolicies(tenantId);
  const getViewUrl = useMyPolicyViewUrl(tenantId);
  const acknowledge = useAcknowledgePolicy(tenantId);

  async function handleView(policyId: string) {
    try {
      const viewUrl = await getViewUrl.mutateAsync(policyId);
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (viewError) {
      toast.error(getApiErrorMessage(viewError, 'Failed to open document'));
    }
  }

  async function handleAcknowledge(policyId: string) {
    try {
      await acknowledge.mutateAsync(policyId);
    } catch (ackError) {
      toast.error(getApiErrorMessage(ackError, 'Failed to record that you read this'));
    }
  }

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load policies')} />;
  }

  if (!policies || policies.length === 0) {
    return <EmptyState icon={FileStack} title="No policies yet" description="Check back soon." />;
  }

  return (
    <div className="space-y-8">
      {groupByFolder(policies).map(([folder, folderPolicies]) => (
        <div key={folder}>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">{folder}</h2>
          <div className="space-y-2">
            {folderPolicies.map((policy) => (
              <div
                key={policy.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{policy.title}</p>
                  <p className="text-sm text-muted-foreground">
                    v{policy.version} · published {new Date(policy.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {policy.acknowledgedByMe ? (
                    <Badge variant="secondary">Read</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledge(policy.id)}
                      disabled={acknowledge.isPending}
                    >
                      I have read this
                    </Button>
                  )}
                  <Button size="sm" onClick={() => handleView(policy.id)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
