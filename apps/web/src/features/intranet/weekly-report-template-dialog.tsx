'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Settings2, Trash2 } from 'lucide-react';
import { useWeeklyReportTemplate, useUpsertWeeklyReportTemplate } from './weekly-report-queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { OrganizationUnitPicker } from '@/features/organizations/organization-unit-picker';

function QuestionsEditor({ tenantId, organizationUnitId }: { tenantId: string; organizationUnitId: string }) {
  const { data: template, isLoading } = useWeeklyReportTemplate(tenantId, organizationUnitId);
  const upsert = useUpsertWeeklyReportTemplate(tenantId, organizationUnitId);
  const [questions, setQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (template) setQuestions(template.questions);
  }, [template?.organizationUnitId, isLoading]);

  function updateQuestion(index: number, value: string) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, '']);
  }

  async function handleSave() {
    const trimmed = questions.map((q) => q.trim()).filter(Boolean);
    if (trimmed.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    try {
      await upsert.mutateAsync(trimmed);
      toast.success('Form saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save form'));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-3">
      {template?.isDefault && (
        <p className="text-sm text-muted-foreground">This department is using the default questions.</p>
      )}
      {questions.map((question, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input value={question} onChange={(e) => updateQuestion(index, e.target.value)} />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(index)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
        <Plus className="size-4" />
        Add question
      </Button>
      <DialogFooter>
        <Button type="button" onClick={handleSave} disabled={upsert.isPending}>
          {upsert.isPending ? 'Saving…' : 'Save form'}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function WeeklyReportTemplateDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [organizationUnitId, setOrganizationUnitId] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOrganizationId('');
          setOrganizationUnitId('');
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 className="size-4" />
          Report form
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weekly report form</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Company</Label>
            <OrganizationPicker
              tenantId={tenantId}
              value={organizationId}
              onChange={(value) => {
                setOrganizationId(value);
                setOrganizationUnitId('');
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <OrganizationUnitPicker
              tenantId={tenantId}
              organizationId={organizationId}
              value={organizationUnitId}
              onChange={setOrganizationUnitId}
            />
          </div>
          {organizationUnitId && <QuestionsEditor tenantId={tenantId} organizationUnitId={organizationUnitId} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
