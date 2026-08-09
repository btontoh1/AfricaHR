import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { getPublicJobRequisition } from '@/lib/public-job-requisition-lookup';
import { PublicApplicationForm } from '@/features/careers/public-application-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function CareersJobPage({
  params,
}: {
  params: Promise<{ requisitionId: string }>;
}) {
  const { requisitionId } = await params;
  const requisition = await getPublicJobRequisition(requisitionId);

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-muted/60 to-background p-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        {requisition ? (
          <>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{requisition.title}</h1>
                <Badge variant="secondary">{requisition.employmentType.replace('_', ' ')}</Badge>
              </div>
              {requisition.description && (
                <p className="whitespace-pre-line text-sm text-muted-foreground">{requisition.description}</p>
              )}
            </div>
            <PublicApplicationForm requisition={requisition} />
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">This role isn&apos;t accepting applications</h1>
              <p className="text-sm text-muted-foreground">
                This job posting has closed, or the link is no longer valid.
              </p>
            </div>
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>No open position matches this link.</AlertDescription>
            </Alert>
            <Button asChild variant="outline">
              <Link href="/">Go home</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
