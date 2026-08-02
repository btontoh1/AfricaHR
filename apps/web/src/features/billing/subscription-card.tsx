'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { useCancelSubscription, useSubscription } from './queries';
import { AssignSubscriptionDialog } from './assign-subscription-dialog';
import { SubscriptionStatusBadge } from './subscription-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function SubscriptionCard({ tenantId, tenantCurrency }: { tenantId: string; tenantCurrency: string }) {
  const [assignOpen, setAssignOpen] = useState(false);
  const { data: summary, isLoading, isError, error } = useSubscription(tenantId);
  const cancelSubscription = useCancelSubscription(tenantId);

  async function handleCancel() {
    try {
      await cancelSubscription.mutateAsync();
      toast.success('Subscription cancelled');
    } catch (cancelError) {
      toast.error(getApiErrorMessage(cancelError, 'Failed to cancel subscription'));
    }
  }

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load subscription')} />;
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CreditCard}
            title="No subscription yet"
            description="Assign a per-employee subscription to start billing this tenant."
            action={
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                Assign subscription
              </Button>
            }
          />
          <AssignSubscriptionDialog
            tenantId={tenantId}
            defaultCurrency={tenantCurrency}
            open={assignOpen}
            onOpenChange={setAssignOpen}
          />
        </CardContent>
      </Card>
    );
  }

  const { subscription } = summary;
  const canCancel = subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Subscription</CardTitle>
        <div className="flex items-center gap-2">
          {summary.isExpiringSoon && <Badge variant="warning">Expiring soon</Badge>}
          <SubscriptionStatusBadge status={subscription.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Price per employee"
            value={formatCurrency(subscription.pricePerEmployee, subscription.currency)}
          />
          <Field label="Active employees" value={summary.activeEmployeeCount} />
          <Field
            label="Amount due next invoice"
            value={formatCurrency(summary.currentAmountDue, subscription.currency)}
          />
          <Field label="Current period start" value={subscription.currentPeriodStart.slice(0, 10)} />
          <Field label="Current period end" value={subscription.currentPeriodEnd.slice(0, 10)} />
        </div>
        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            disabled={cancelSubscription.isPending}
            onClick={handleCancel}
          >
            Cancel subscription
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
