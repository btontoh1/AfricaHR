'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMyWeeklyReportTemplate, useMyWeeklyReports, useSubmitWeeklyReport } from './weekly-report-queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';

/** Monday 00:00 UTC of the week containing `date` - mirrors intranet-domain's getWeekStart. */
function getWeekStart(date: Date): Date {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  utcDate.setUTCDate(utcDate.getUTCDate() - diffToMonday);
  return utcDate;
}

export function SubmitWeeklyReportForm({ tenantId }: { tenantId: string }) {
  const { data: template, isLoading: isLoadingTemplate } = useMyWeeklyReportTemplate(tenantId);
  const { data: reports, isLoading: isLoadingReports } = useMyWeeklyReports(tenantId);
  const submitReport = useSubmitWeeklyReport(tenantId);
  const [answers, setAnswers] = useState<string[]>([]);

  const currentWeekStart = getWeekStart(new Date()).toISOString().slice(0, 10);
  const existingReport = reports?.find((r) => r.weekStart === currentWeekStart);

  useEffect(() => {
    if (!template) return;
    setAnswers(existingReport?.answers ?? template.questions.map(() => ''));
    // Only re-run when the question set or the existing report's id changes, not on every answers edit.
  }, [template, existingReport?.id]);

  async function handleSubmit() {
    try {
      await submitReport.mutateAsync({ weekStart: currentWeekStart, answers });
      toast.success(existingReport ? 'Report updated' : 'Report submitted');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to submit report'));
    }
  }

  if (isLoadingTemplate || isLoadingReports) {
    return <CardSkeleton />;
  }

  if (!template) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>This week&apos;s report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingReport && (
          <p className="text-sm text-muted-foreground">
            You already submitted this week&apos;s report on {new Date(existingReport.submittedAt ?? existingReport.createdAt).toLocaleString()}. Editing below will update it.
          </p>
        )}
        {template.questions.map((question, index) => (
          <div key={question} className="space-y-1.5">
            <Label>{question}</Label>
            <Textarea
              value={answers[index] ?? ''}
              onChange={(e) =>
                setAnswers((prev) => {
                  const next = [...prev];
                  next[index] = e.target.value;
                  return next;
                })
              }
              rows={3}
            />
          </div>
        ))}
        <Button type="button" onClick={handleSubmit} disabled={submitReport.isPending}>
          {submitReport.isPending ? 'Saving…' : existingReport ? 'Update report' : 'Submit report'}
        </Button>
      </CardContent>
    </Card>
  );
}
