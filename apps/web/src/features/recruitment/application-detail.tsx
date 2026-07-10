'use client';

import {
  useAdvanceApplication,
  useAdvanceMyApplication,
  useApplication,
  useMyApplication,
} from './queries';
import { ApplicationStageBadge } from './application-stage-badge';
import { AdvanceStageControl } from './advance-stage-control';
import { SendOfferForm } from './send-offer-form';
import { RespondToOfferControl } from './respond-to-offer-control';
import { LinkHiredEmployeeForm } from './link-hired-employee-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function ApplicationDetail({
  tenantId,
  applicationId,
  tier,
}: {
  tenantId: string;
  applicationId: string;
  tier: 'hr' | 'manager';
}) {
  const hrQuery = useApplication(tenantId, tier === 'hr' ? applicationId : '');
  const managerQuery = useMyApplication(tenantId, tier === 'manager' ? applicationId : '');
  const { data: application, isLoading, isError, error } = tier === 'hr' ? hrQuery : managerQuery;

  const advanceHr = useAdvanceApplication(tenantId, applicationId);
  const advanceManager = useAdvanceMyApplication(tenantId, applicationId);
  const onAdvance = tier === 'hr' ? advanceHr.mutateAsync : advanceManager.mutateAsync;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load application')}
      </p>
    );
  }

  const canSendOffer = tier === 'hr' && application.stage === 'OFFER' && !application.offerSentAt;
  const canRespondToOffer =
    tier === 'hr' && application.stage === 'OFFER' && Boolean(application.offerSentAt) && !application.offerRespondedAt;
  const canLinkEmployee = tier === 'hr' && application.stage === 'HIRED' && !application.hiredEmployeeId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {application.candidate.firstName} {application.candidate.lastName}
        </h1>
        <ApplicationStageBadge stage={application.stage} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Requisition" value={application.requisition.title} />
          <Field label="Candidate email" value={application.candidate.email} />
          <Field label="Applied" value={application.appliedAt.slice(0, 10)} />
          <Field label="Notes" value={application.notes} />
          <Field label="Rejection reason" value={application.rejectionReason} />
          <Field label="Offered salary" value={application.offeredSalary} />
          <Field
            label="Offered start date"
            value={application.offeredStartDate ? application.offeredStartDate.slice(0, 10) : undefined}
          />
          <Field
            label="Offer accepted"
            value={
              application.offerAccepted === null || application.offerAccepted === undefined
                ? undefined
                : application.offerAccepted
                  ? 'Yes'
                  : 'No'
            }
          />
          <Field label="Hired employee" value={application.hiredEmployeeId} />
        </CardContent>
      </Card>

      <AdvanceStageControl currentStage={application.stage} onAdvance={onAdvance} />

      {canSendOffer && <SendOfferForm tenantId={tenantId} applicationId={applicationId} />}
      {canRespondToOffer && (
        <RespondToOfferControl tenantId={tenantId} applicationId={applicationId} />
      )}
      {canLinkEmployee && (
        <LinkHiredEmployeeForm tenantId={tenantId} applicationId={applicationId} />
      )}
    </div>
  );
}
