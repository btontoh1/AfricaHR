'use client';

import { useState } from 'react';
import { useMyGoals } from './queries';
import { GoalStatusBadge } from './goal-status-badge';
import { UpdateGoalForm } from './update-goal-form';
import { getApiErrorMessage } from '@/lib/api-error';
import type { PerformanceGoal } from './types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function MyGoalsList({ tenantId }: { tenantId: string }) {
  const { data: goals, isLoading, isError, error } = useMyGoals(tenantId);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Failed to load goals')}</p>
    );
  }

  if (!goals || goals.length === 0) {
    return <p className="text-sm text-muted-foreground">No goals yet.</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Target date</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {goals.map((goal) => (
            <TableRow key={goal.id}>
              <TableCell>{goal.title}</TableCell>
              <TableCell>
                <GoalStatusBadge status={goal.status} />
              </TableCell>
              <TableCell>{goal.progressPercent}%</TableCell>
              <TableCell>{goal.targetDate ? goal.targetDate.slice(0, 10) : '—'}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => setEditingGoal(goal)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editingGoal && (
        <UpdateGoalForm tenantId={tenantId} goal={editingGoal} onDone={() => setEditingGoal(null)} />
      )}
    </div>
  );
}
