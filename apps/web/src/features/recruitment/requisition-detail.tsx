'use client';

import Link from 'next/link';
import { FileStack } from 'lucide-react';
import {
  useApplications,
  useMyApplications,
  useMyRequisition,
  useRequisition,
  useUpdateMyRequisition,
  useUpdateRequisition,
} from './queries';
import { RequisitionStatusBadge } from './requisition-status-badge';
import { ApplicationStageBadge } from './application-stage-badge';
import { UpdateRequisitionForm } from './update-requisition-form';
import { PublicApplicationLinkCard } from './public-application-link-card';
import { useOrganization } from '@/features/organizations/queries';
import { useEmployee } from '@/features/employees/queries';
import { getApiErrorMessage } from '@/lib/api-error';
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function RequisitionDetail({
  tenantId,
  requisitionId,
  tier,
}: {
  tenantId: string;
  requisitionId: string;
  tier: 'hr' | 'manager';
}) {
  const hrQuery = useRequisition(tenantId, tier === 'hr' ? requisitionId : '');
  const managerQuery = useMyRequisition(tenantId, tier === 'manager' ? requisitionId : '');
  const { data: requisition, isLoading, isError, error } = tier === 'hr' ? hrQuery : managerQuery;

  const updateHr = useUpdateRequisition(tenantId, requisitionId);
  const updateManager = useUpdateMyRequisition(tenantId, requisitionId);
  const onUpdate = tier === 'hr' ? updateHr.mutateAsync : updateManager.mutateAsync;

  const hrApplications = useApplications(tenantId, tier === 'hr' ? { requisitionId } : {});
  const myApplications = useMyApplications(tenantId);
  const applications =
    tier === 'hr'
      ? hrApplications.data
      : myApplications.data?.filter((application) => application.requisitionId === requisitionId);
  const applicationsBasePath = tier === 'hr' ? '/recruitment/applications' : '/recruitment/applications/mine';

  const { data: organization } = useOrganization(tenantId, requisition?.organizationId ?? '');
  const { data: hiringManager } = useEmployee(tenantId, requisition?.hiringManagerId ?? '');

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !requisition) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load job requisition')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={requisition.title} action={<RequisitionStatusBadge status={requisition.status} />} />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Organization" value={organization?.legalName} />
          <Field
            label="Hiring manager"
            value={hiringManager ? `${hiringManager.firstName} ${hiringManager.lastName}` : undefined}
          />
          <Field label="Employment type" value={requisition.employmentType.replace('_', ' ')} />
          <Field label="Openings" value={requisition.openings} />
          <Field
            label="Target hire date"
            value={requisition.targetHireDate ? requisition.targetHireDate.slice(0, 10) : undefined}
          />
          <Field label="Description" value={requisition.description} />
        </CardContent>
      </Card>

      <PublicApplicationLinkCard requisition={requisition} />

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {!applications || applications.length === 0 ? (
            <EmptyState icon={FileStack} title="No applications for this requisition yet" />
          ) : (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {application.candidate.firstName} {application.candidate.lastName}
                      </TableCell>
                      <TableCell>
                        <ApplicationStageBadge stage={application.stage} />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`${applicationsBasePath}/${application.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateRequisitionForm tenantId={tenantId} requisition={requisition} onUpdate={onUpdate} />
        </CardContent>
      </Card>
    </div>
  );
}
