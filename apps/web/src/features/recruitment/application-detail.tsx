'use client';

import { toast } from 'sonner';
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
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

function DocumentField({
  label,
  fileName,
  onView,
}: {
  label: string;
  fileName?: string | null;
  onView: () => void;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {fileName ? (
        <button type="button" onClick={onView} className="text-sm text-primary hover:underline">
          {fileName}
        </button>
      ) : (
        <div className="text-sm">—</div>
      )}
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
    return <CardSkeleton />;
  }

  if (isError || !application) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load application')} />;
  }

  const canSendOffer = tier === 'hr' && application.stage === 'OFFER' && !application.offerSentAt;
  const canRespondToOffer =
    tier === 'hr' && application.stage === 'OFFER' && Boolean(application.offerSentAt) && !application.offerRespondedAt;
  const canLinkEmployee = tier === 'hr' && application.stage === 'HIRED' && !application.hiredEmployeeId;

  async function handleViewResume() {
    const { data, error: viewError } =
      tier === 'hr'
        ? await apiClient.GET('/api/tenants/{tenantId}/applications/{id}/resume-view-url', {
            params: { path: { tenantId, id: applicationId } },
          })
        : await apiClient.GET('/api/tenants/{tenantId}/applications/mine/{id}/resume-view-url', {
            params: { path: { tenantId, id: applicationId } },
          });
    if (viewError || !data) {
      toast.error(getApiErrorMessage(viewError, 'Failed to open resume'));
      return;
    }
    window.open(data.viewUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleViewIdentityDocument() {
    const { data, error: viewError } =
      tier === 'hr'
        ? await apiClient.GET('/api/tenants/{tenantId}/applications/{id}/identity-document-view-url', {
            params: { path: { tenantId, id: applicationId } },
          })
        : await apiClient.GET('/api/tenants/{tenantId}/applications/mine/{id}/identity-document-view-url', {
            params: { path: { tenantId, id: applicationId } },
          });
    if (viewError || !data) {
      toast.error(getApiErrorMessage(viewError, 'Failed to open identity document'));
      return;
    }
    window.open(data.viewUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${application.candidate.firstName} ${application.candidate.lastName}`}
        action={<ApplicationStageBadge stage={application.stage} />}
      />

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
          <DocumentField label="Resume" fileName={application.resumeFileName} onView={handleViewResume} />
          <DocumentField
            label={
              application.identityDocumentType
                ? `Government ID (${application.identityDocumentType.replace('_', ' ')})`
                : 'Government ID'
            }
            fileName={application.identityDocumentFileName}
            onView={handleViewIdentityDocument}
          />
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
