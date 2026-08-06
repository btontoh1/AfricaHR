'use client';

import { Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/app/(app)/session-provider';
import { useOrganization, useOrganizationUnits, useSubmitForVerification, useVerificationDocuments } from './queries';
import { CreateOrganizationUnitForm } from './create-organization-unit-form';
import { EditOrganizationDialog } from './edit-organization-dialog';
import { OrganizationVerificationStatusBadge } from './organization-verification-status-badge';
import { UploadVerificationDocumentForm } from './upload-verification-document-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { apiClient } from '@/lib/api-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/** Shows a shortened id with the full value available on hover, rather than the full UUID inline. */
function IdCell({ id }: { id?: string | null }) {
  if (!id) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span title={id} className="cursor-help">
      {id.slice(0, 8)}…
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function OrganizationDetail({
  tenantId,
  organizationId,
}: {
  tenantId: string;
  organizationId: string;
}) {
  const session = useSession();
  const { data: organization, isLoading, isError, error } = useOrganization(tenantId, organizationId);
  const { data: units } = useOrganizationUnits(tenantId, organizationId);
  const { data: documents } = useVerificationDocuments(tenantId, organizationId);
  const submitForVerification = useSubmitForVerification(tenantId);
  const canEdit = session.role === 'TENANT_ADMIN' || session.role === 'PLATFORM_ADMIN';

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !organization) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load organization')} />;
  }

  const canSubmit = organization.verificationStatus === 'UNVERIFIED' || organization.verificationStatus === 'REJECTED';

  async function handleSubmitForVerification() {
    try {
      await submitForVerification.mutateAsync(organizationId);
      toast.success('Submitted for verification');
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, 'Failed to submit for verification'));
    }
  }

  async function handleViewDocument(documentId: string) {
    const { data, error: viewError } = await apiClient.GET(
      '/api/tenants/{tenantId}/organizations/{id}/verification-documents/{docId}/view-url',
      { params: { path: { tenantId, id: organizationId, docId: documentId } } },
    );
    if (viewError || !data) {
      toast.error(getApiErrorMessage(viewError, 'Failed to open document'));
      return;
    }
    window.open(data.viewUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization.legalName}
        description={organization.tradingName ? `Trading as ${organization.tradingName}` : undefined}
        action={
          <div className="flex items-center gap-2">
            <OrganizationVerificationStatusBadge status={organization.verificationStatus} />
            {canEdit && <EditOrganizationDialog tenantId={tenantId} organization={organization} />}
          </div>
        }
      />

      {organization.verificationStatus === 'REJECTED' && organization.verificationNote && (
        <Alert variant="destructive">
          <AlertTitle>Verification rejected</AlertTitle>
          <AlertDescription>{organization.verificationNote}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Country" value={organization.countryCode} />
          <Field label="Registration number" value={organization.registrationNumber} />
          <Field label="Tax identification number" value={organization.taxIdentificationNumber} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal-entity verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents && documents.length > 0 && (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>{document.documentType}</TableCell>
                      <TableCell>{document.fileName}</TableCell>
                      <TableCell className="text-muted-foreground">{document.createdAt.slice(0, 10)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleViewDocument(document.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )}
          {documents && documents.length === 0 && (
            <EmptyState icon={FileText} title="No documents yet" description="Upload supporting evidence below." />
          )}
          <UploadVerificationDocumentForm tenantId={tenantId} organizationId={organizationId} />
          {canSubmit && (
            <Button onClick={handleSubmitForVerification} disabled={submitForVerification.isPending}>
              {submitForVerification.isPending ? 'Submitting…' : 'Submit for verification'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization units</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {units && units.length > 0 && (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Parent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell>{unit.name}</TableCell>
                      <TableCell>{unit.code}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <IdCell id={unit.id} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <IdCell id={unit.parentId} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )}
          {units && units.length === 0 && (
            <EmptyState icon={Building2} title="No units yet" description="Create the first organization unit below." />
          )}
          <CreateOrganizationUnitForm tenantId={tenantId} organizationId={organizationId} />
        </CardContent>
      </Card>
    </div>
  );
}
