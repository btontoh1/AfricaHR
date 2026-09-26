'use client';

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface ReportLineSeries {
  key: string;
  label: string;
  color: string;
}

/**
 * Shared trend-over-time chart for report history (MRR/ARR over months,
 * etc). Same chrome/color/empty-state conventions as ReportBarChart - see
 * that file for why the axis/grid pull from CSS custom properties instead
 * of hardcoded colors.
 */
export function ReportLineChart({
  data,
  categoryKey,
  series,
  valueFormatter,
  height = 320,
}: {
  data: Array<Record<string, unknown>>;
  categoryKey: string;
  series: ReportLineSeries[];
  valueFormatter?: (value: number) => string;
  height?: number;
}) {
  const format = (value: number) => (valueFormatter ? valueFormatter(value) : String(value));

  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-lg border text-sm text-muted-foreground">
        No data for this view
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis dataKey={categoryKey} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} stroke="var(--border)" />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={format}
            stroke="var(--border)"
          />
          <Tooltip
            formatter={(value) => format(Number(value))}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
            }}
            labelStyle={{ color: 'var(--foreground)' }}
            cursor={{ stroke: 'var(--border)' }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }} />}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
