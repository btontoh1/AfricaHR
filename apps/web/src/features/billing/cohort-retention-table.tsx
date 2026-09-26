import type { PlatformSaasMetrics } from './types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { Layers } from 'lucide-react';

/**
 * Sequential single-hue ramp (light -> dark blue, matching --chart-1) for a
 * retention heatmap - magnitude encoding, not categorical identity, so one
 * hue graded by lightness is the right encoding per the data-viz color
 * formula. Text stays on the default ink color throughout (never colored
 * text-on-color for the percentage itself), and the percentage is always
 * printed so the color is a reinforcement, not the only signal.
 */
function retentionCellStyle(percent: number): React.CSSProperties {
  const clamped = Math.max(0, Math.min(100, percent));
  return { backgroundColor: `color-mix(in srgb, var(--chart-1) ${clamped}%, transparent)` };
}

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function CohortRetentionTable({ cohortRetention }: { cohortRetention: PlatformSaasMetrics['cohortRetention'] }) {
  if (cohortRetention.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Not enough history yet"
        description="Cohort retention needs at least one full month of billed tenants to show anything."
      />
    );
  }

  const monthsElapsedColumns = Math.max(...cohortRetention.map((row) => row.retentionByMonthsElapsed.length));

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cohort</TableHead>
            <TableHead>Tenants</TableHead>
            {Array.from({ length: monthsElapsedColumns }).map((_, index) => (
              <TableHead key={index} className="text-center">
                {index === 0 ? 'Signup month' : `+${index}mo`}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {cohortRetention.map((row) => (
            <TableRow key={row.cohortMonth}>
              <TableCell className="font-medium">{formatMonthLabel(row.cohortMonth)}</TableCell>
              <TableCell className="text-muted-foreground">{row.cohortSize}</TableCell>
              {Array.from({ length: monthsElapsedColumns }).map((_, index) => {
                const percent = row.retentionByMonthsElapsed[index];
                return (
                  <TableCell key={index} className="text-center" style={percent === undefined ? undefined : retentionCellStyle(percent)}>
                    {percent === undefined ? '' : `${percent}%`}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
