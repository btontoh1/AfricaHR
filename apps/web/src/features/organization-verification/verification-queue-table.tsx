'use client';

import { Fragment, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getQueueDocumentViewUrl, useQueueDocuments, useVerificationQueue, useVerifyOrganization } from './queries';
import { RejectOrganizationDialog } from './reject-organization-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function DocumentsList({ organizationId }: { organizationId: string }) {
  const { data: documents, isLoading } = useQueueDocuments(organizationId);

  async function handleView(documentId: string) {
    try {
      const viewUrl = await getQueueDocumentViewUrl(organizationId, documentId);
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to open document'));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading documents…</p>;
  }

  if (!documents || documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No supporting documents were uploaded.</p>;
  }

  return (
    <ul className="space-y-1">
      {documents.map((document) => (
        <li key={document.id}>
          <button
            type="button"
            onClick={() => handleView(document.id)}
            className="text-sm text-primary hover:underline"
          >
            {document.documentType} — {document.fileName}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function VerificationQueueTable() {
  const { data: organizations, isLoading, isError, error } = useVerificationQueue();
  const verifyOrganization = useVerifyOrganization();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleVerify(id: string) {
    try {
      await verifyOrganization.mutateAsync(id);
      toast.success('Organization verified');
    } catch (verifyError) {
      toast.error(getApiErrorMessage(verifyError, 'Failed to verify organization'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load the verification queue')} />;
  }

  if (!organizations || organizations.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nothing pending review"
        description="Organizations submitted for verification will show up here."
      />
    );
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Legal name</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Registration #</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((organization) => (
            <Fragment key={organization.id}>
              <TableRow>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === organization.id ? null : organization.id)}
                    className="font-medium hover:underline"
                  >
                    {organization.legalName}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">{organization.countryCode}</TableCell>
                <TableCell className="text-muted-foreground">{organization.registrationNumber}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleVerify(organization.id)} disabled={verifyOrganization.isPending}>
                      Verify
                    </Button>
                    <RejectOrganizationDialog id={organization.id} />
                  </div>
                </TableCell>
              </TableRow>
              {expandedId === organization.id && (
                <TableRow>
                  <TableCell colSpan={4} className="bg-muted/30">
                    <DocumentsList organizationId={organization.id} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
