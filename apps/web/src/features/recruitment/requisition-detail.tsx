'use client';

import Link from 'next/link';
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
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !requisition) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load job requisition')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{requisition.title}</h1>
        <RequisitionStatusBadge status={requisition.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Employment type" value={requisition.employmentType.replace('_', ' ')} />
          <Field label="Openings" value={requisition.openings} />
          <Field
            label="Target hire date"
            value={requisition.targetHireDate ? requisition.targetHireDate.slice(0, 10) : undefined}
          />
          <Field label="Description" value={requisition.description} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {!applications || applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications for this requisition yet.</p>
          ) : (
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
                    <TableCell>
                      {application.candidate.firstName} {application.candidate.lastName}
                    </TableCell>
                    <TableCell>
                      <ApplicationStageBadge stage={application.stage} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${applicationsBasePath}/${application.id}`}
                        className="text-sm underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
