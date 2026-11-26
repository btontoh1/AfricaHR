'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useWeeklyReportTemplate, useWeeklyReportComments, useAddWeeklyReportComment } from './weekly-report-queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { WeeklyReport } from './weekly-report-types';

export function WeeklyReportDetailDialog({
  tenantId,
  report,
  open,
  onOpenChange,
}: {
  tenantId: string;
  report: WeeklyReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: template } = useWeeklyReportTemplate(tenantId, report?.organizationUnitId ?? '');
  const { data: comments } = useWeeklyReportComments(tenantId, report?.id ?? null);
  const addComment = useAddWeeklyReportComment(tenantId, report?.id ?? '');
  const [body, setBody] = useState('');

  async function handleAddComment() {
    if (!body.trim()) return;
    try {
      await addComment.mutateAsync(body.trim());
      setBody('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add comment'));
    }
  }

  if (!report) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {report.employeeName} — week of {new Date(report.weekStart).toLocaleDateString()}
            {report.isLate && <Badge variant="destructive">Late</Badge>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(template?.questions ?? report.answers.map((_, i) => `Question ${i + 1}`)).map((question, index) => (
            <div key={question} className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{question}</p>
              <p className="whitespace-pre-wrap text-sm">{report.answers[index] || '—'}</p>
            </div>
          ))}
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Comments</p>
            {comments?.length ? (
              <div className="space-y-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border p-2 text-sm">
                    <p className="font-medium">{comment.authorName}</p>
                    <p>{comment.body}</p>
                    <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            )}
            <div className="flex gap-2">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Add a comment…" />
              <Button type="button" onClick={handleAddComment} disabled={addComment.isPending || !body.trim()}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
