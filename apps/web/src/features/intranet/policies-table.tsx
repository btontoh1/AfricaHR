'use client';

import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import { FileStack } from 'lucide-react';
import { usePolicies, usePolicyViewUrl } from './queries';
import { AudienceBadge } from './audience-badge';
import { PolicyAcknowledgementsList } from './policy-acknowledgements-list';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export function PoliciesTable({ tenantId }: { tenantId: string }) {
  const { data: policies, isLoading, isError, error } = usePolicies(tenantId);
  const getViewUrl = usePolicyViewUrl(tenantId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleView(policyId: string) {
    try {
      const viewUrl = await getViewUrl.mutateAsync(policyId);
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (viewError) {
      toast.error(getApiErrorMessage(viewError, 'Failed to open document'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load policies')} />;
  }

  if (!policies || policies.length === 0) {
    return (
      <EmptyState icon={FileStack} title="No policies yet" description="Upload your first policy document above." />
    );
  }

  return (
    <div className="space-y-8">
      {groupByFolder(policies).map(([folder, folderPolicies]) => (
        <div key={folder}>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">{folder}</h2>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Visible to</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {folderPolicies.map((policy) => (
                  <Fragment key={policy.id}>
                    <TableRow>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === policy.id ? null : policy.id)}
                          className="font-medium hover:underline"
                        >
                          {policy.title}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{policy.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <AudienceBadge tenantId={tenantId} item={policy} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(policy.publishedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleView(policy.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedId === policy.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30">
                          <PolicyAcknowledgementsList tenantId={tenantId} policyId={policy.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>
      ))}
    </div>
  );
}
