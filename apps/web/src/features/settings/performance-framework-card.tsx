'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useUpdatePerformanceFramework } from './queries';
import type { MyTenant, PerformanceFramework } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FRAMEWORK_LABEL: Record<PerformanceFramework, string> = {
  STANDARD: 'Standard',
  BALANCED_SCORECARD: 'Balanced Scorecard (for financial institutions)',
};

export function PerformanceFrameworkCard({ tenant }: { tenant: MyTenant }) {
  const [selected, setSelected] = useState<PerformanceFramework>(tenant.performanceFramework);
  const updateFramework = useUpdatePerformanceFramework();

  const isDirty = selected !== tenant.performanceFramework;

  async function handleSave() {
    try {
      await updateFramework.mutateAsync(selected);
      toast.success('Performance Management framework updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update framework'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Management framework</CardTitle>
        <CardDescription>
          Balanced Scorecard groups every goal into 4 perspectives — Financial, Customer, People, and
          Risk &amp; Control — the framework banks and other financial institutions commonly use for
          performance management. Standard leaves goals uncategorized.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-4">
        <Select value={selected} onValueChange={(value) => setSelected(value as PerformanceFramework)}>
          <SelectTrigger className="w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FRAMEWORK_LABEL) as PerformanceFramework[]).map((framework) => (
              <SelectItem key={framework} value={framework}>
                {FRAMEWORK_LABEL[framework]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={handleSave} disabled={!isDirty || updateFramework.isPending}>
          {updateFramework.isPending ? 'Saving…' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}
