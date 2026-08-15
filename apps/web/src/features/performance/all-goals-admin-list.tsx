'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';
import { useAllGoals } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { useMyTenant } from '@/features/settings/queries';
import { GoalStatusBadge } from './goal-status-badge';
import { AdminUpdateGoalForm } from './admin-update-goal-form';
import { GOAL_PERSPECTIVES, GOAL_PERSPECTIVE_LABEL } from './goal-perspective-labels';
import type { PerformanceGoal, PerformanceGoalStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ALL = 'ALL';
const STATUS_FILTERS: (PerformanceGoalStatus | typeof ALL)[] = [
  ALL,
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

function GoalsTable({
  goals,
  employeeName,
  onEdit,
}: {
  goals: PerformanceGoal[];
  employeeName: (id: string) => string;
  onEdit: (goal: PerformanceGoal) => void;
}) {
  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
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
              <TableCell className="font-medium">{employeeName(goal.employeeId)}</TableCell>
              <TableCell>{goal.title}</TableCell>
              <TableCell><GoalStatusBadge status={goal.status} /></TableCell>
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

export function AllGoalsAdminList({ tenantId }: { tenantId: string }) {
  const [employeeId, setEmployeeId] = useState(ALL);
  const [status, setStatus] = useState<PerformanceGoalStatus | typeof ALL>(ALL);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);

  const { data: employees } = useEmployees(tenantId);
  const { data: tenant } = useMyTenant();
  const isBalancedScorecard = tenant?.performanceFramework === 'BALANCED_SCORECARD';
  const { data: goals, isLoading, isError, error } = useAllGoals(tenantId, {
    employeeId: employeeId === ALL ? undefined : employeeId,
    status: status === ALL ? undefined : status,
  });

  const employeeName = (id: string) => {
    const employee = employees?.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : id;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All employees</SelectItem>
            {employees?.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <TableSkeleton />}
      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load goals')} />}
      {goals && goals.length === 0 && (
        <EmptyState icon={Target} title="No goals match this filter" />
      )}
      {goals && goals.length > 0 && (
        isBalancedScorecard ? (
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
                  <GoalsTable goals={perspectiveGoals} employeeName={employeeName} onEdit={setEditingGoal} />
                </div>
              );
            })}
            {goals.some((goal) => !goal.perspective) && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">Unassigned</h2>
                <GoalsTable
                  goals={goals.filter((goal) => !goal.perspective)}
                  employeeName={employeeName}
                  onEdit={setEditingGoal}
                />
              </div>
            )}
          </div>
        ) : (
          <GoalsTable goals={goals} employeeName={employeeName} onEdit={setEditingGoal} />
        )
      )}
      {editingGoal && (
        <AdminUpdateGoalForm tenantId={tenantId} goal={editingGoal} onDone={() => setEditingGoal(null)} />
      )}
    </div>
  );
}
