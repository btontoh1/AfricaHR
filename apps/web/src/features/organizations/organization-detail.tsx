'use client';

import { useState } from 'react';
import { Building2, Check, Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/app/(app)/session-provider';
import { useOrganization, useOrganizationUnits, useSubmitForVerification, useVerificationDocuments } from './queries';
import { useMyTenant } from '@/features/settings/queries';
import { useTenant } from '@/features/platform-tenants/queries';
import { CreateOrganizationUnitForm } from './create-organization-unit-form';
import { EditOrganizationDialog } from './edit-organization-dialog';
import { EditOrganizationUnitDialog } from './edit-organization-unit-dialog';
import { RemoveOrganizationUnitDialog } from './remove-organization-unit-dialog';
import { OrganizationLogoCard } from './organization-logo-card';
import { OrganizationVerificationStatusBadge } from './organization-verification-status-badge';
import { UploadVerificationDocumentForm } from './upload-verification-document-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { apiClient } from '@/lib/api-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  backHref = '/organizations',
}: {
  tenantId: string;
  organizationId: string;
  /** Platform admins viewing a tenant's organization from the platform-admin console link back to that tenant's page instead of the tenant's own /organizations list. */
  backHref?: string;
}) {
  const session = useSession();
  const { data: organization, isLoading, isError, error } = useOrganization(tenantId, organizationId);
  const { data: units } = useOrganizationUnits(tenantId, organizationId);
  const { data: documents } = useVerificationDocuments(tenantId, organizationId);
  const submitForVerification = useSubmitForVerification(tenantId);
  const isPlatformAdmin = session.role === 'PLATFORM_ADMIN';
  // A platform admin here is viewing some other tenant's organization, not
  // their own - /api/tenants/me would resolve the wrong tenant (or none),
  // so they go through the platform-admin-only /api/tenants/{id} lookup
  // instead. Every other role can only ever reach this page for their own
  // tenant's organization, so /api/tenants/me is always correct for them.
  const { data: myTenant } = useMyTenant({ enabled: !isPlatformAdmin });
  const { data: tenantById } = useTenant(isPlatformAdmin ? tenantId : '');
  const tenant = isPlatformAdmin ? tenantById : myTenant;
  const [copied, setCopied] = useState(false);
  const canEdit = session.role === 'TENANT_ADMIN' || session.role === 'PLATFORM_ADMIN';
  // Broader than canEdit - invoice branding is granted to ORG_ADMIN too
  // (see INVOICING_MANAGE's doc comment in system-role.ts), but only for
  // their own organization, same scoping the backend enforces.
  const canManageInvoicing =
    session.role === 'PLATFORM_ADMIN' ||
    session.role === 'TENANT_ADMIN' ||
    session.role === 'HR_MANAGER' ||
    (session.role === 'ORG_ADMIN' && session.organizationId === organizationId);

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

  async function handleCopyLoginUrl() {
    if (!tenant || !organization) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/login/${tenant.slug}/${organization.slug}`);
      setCopied(true);
      toast.success('Login URL copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization.legalName}
        description={organization.tradingName ? `Trading as ${organization.tradingName}` : undefined}
        backHref={backHref}
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
          <Field label="Address" value={organization.address} />
        </CardContent>
      </Card>

      {tenant && (
        <Card>
          <CardHeader>
            <CardTitle>Sign-in link</CardTitle>
            <CardDescription>
              Share this link with this organization&apos;s own team — it takes them straight to a sign-in page
              branded for {organization.tradingName ?? organization.legalName}, rather than{' '}
              {tenant.name}&apos;s general one. Anyone with a login in this tenant can still use it; it only
              changes the page they see, not who can sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/login/${tenant.slug}/${organization.slug}`}
                className="font-mono text-sm"
                onFocus={(e) => e.target.select()}
              />
              <Button type="button" variant="outline" onClick={handleCopyLoginUrl}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canManageInvoicing && <OrganizationLogoCard tenantId={tenantId} organizationId={organizationId} />}

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
                    <TableHead>Parent</TableHead>
                    {canEdit && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => {
                    const parent = units.find((candidate) => candidate.id === unit.parentId);
                    return (
                      <TableRow key={unit.id}>
                        <TableCell>{unit.name}</TableCell>
                        <TableCell className="text-muted-foreground">{unit.code}</TableCell>
                        <TableCell>{parent ? parent.name : <span className="text-muted-foreground">—</span>}</TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <EditOrganizationUnitDialog
                                tenantId={tenantId}
                                organizationId={organizationId}
                                unit={unit}
                              />
                              <RemoveOrganizationUnitDialog
                                tenantId={tenantId}
                                organizationId={organizationId}
                                unitId={unit.id}
                                unitName={unit.name}
                              />
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
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
