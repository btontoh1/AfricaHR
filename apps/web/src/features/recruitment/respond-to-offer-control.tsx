'use client';

import { toast } from 'sonner';
import { useRespondToOffer } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RespondToOfferControl({
  tenantId,
  applicationId,
}: {
  tenantId: string;
  applicationId: string;
}) {
  const respondToOffer = useRespondToOffer(tenantId, applicationId);

  async function handleRespond(accepted: boolean) {
    try {
      await respondToOffer.mutateAsync({ accepted });
      toast.success(accepted ? 'Offer accepted' : 'Offer declined');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to record the offer response'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Offer response</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button onClick={() => handleRespond(true)} disabled={respondToOffer.isPending}>
          Accept
        </Button>
        <Button
          variant="outline"
          onClick={() => handleRespond(false)}
          disabled={respondToOffer.isPending}
        >
          Decline
        </Button>
      </CardContent>
    </Card>
  );
}
