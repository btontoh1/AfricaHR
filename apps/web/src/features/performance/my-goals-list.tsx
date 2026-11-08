'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';
import { useMyGoals } from './queries';
import { useMyTenant } from '@/features/settings/queries';
import { GoalStatusBadge } from './goal-status-badge';
import { UpdateGoalForm } from './update-goal-form';
import { GOAL_PERSPECTIVES, GOAL_PERSPECTIVE_LABEL } from './goal-perspective-labels';
import { getApiErrorMessage, isNoEmployeeLinkedError } from '@/lib/api-error';
import type { PerformanceGoal } from './types';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { EmployeeLinkRequiredState } from '@/components/employee-link-required-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function GoalsTable({ goals, onEdit }: { goals: PerformanceGoal[]; onEdit: (goal: PerformanceGoal) => void }) {
  return (
    <TableCard>
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
              <TableCell className="font-medium">{goal.title}</TableCell>
              <TableCell>
                <GoalStatusBadge status={goal.status} />
              </TableCell>
              <TableCell>{goal.progressPercent}%</TableCell>
              <TableCell className="text-muted-foreground">
                {goal.targetDate ? goal.targetDate.slice(0, 10) : '—'}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => onEdit(goal)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}

export function MyGoalsList({ tenantId }: { tenantId: string }) {
  const { data: goals, isLoading, isError, error } = useMyGoals(tenantId);
  const { data: tenant } = useMyTenant();
  const isBalancedScorecard = tenant?.performanceFramework === 'BALANCED_SCORECARD';
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    if (isNoEmployeeLinkedError(error)) {
      return <EmployeeLinkRequiredState />;
    }
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load goals')} />;
  }

  if (!goals || goals.length === 0) {
    return <EmptyState icon={Target} title="No goals yet" description="Add your first goal above." />;
  }

  return (
    <div className="space-y-4">
      {isBalancedScorecard ? (
        <div className="space-y-8">
          {GOAL_PERSPECTIVES.map((perspective) => {
            const perspectiveGoals = goals.filter((goal) => goal.perspective === perspective);
            if (perspectiveGoals.length === 0) {
              return null;
            }
            return (
              <div key={perspective}>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  {GOAL_PERSPECTIVE_LABEL[perspective]}
                </h2>
                <GoalsTable goals={perspectiveGoals} onEdit={setEditingGoal} />
              </div>
            );
          })}
          {goals.some((goal) => !goal.perspective) && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Unassigned</h2>
              <GoalsTable goals={goals.filter((goal) => !goal.perspective)} onEdit={setEditingGoal} />
            </div>
          )}
        </div>
      ) : (
        <GoalsTable goals={goals} onEdit={setEditingGoal} />
      )}
      {editingGoal && (
        <UpdateGoalForm tenantId={tenantId} goal={editingGoal} onDone={() => setEditingGoal(null)} />
      )}
    </div>
  );
}
