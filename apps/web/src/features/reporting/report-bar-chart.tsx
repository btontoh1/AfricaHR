'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface ReportBarSeries {
  key: string;
  label: string;
  color: string;
}

/**
 * Shared bar chart for report breakdowns - one axis, thin bars with rounded
 * outward corners, theme-aware chrome (axis/grid pull from the CSS custom
 * properties in global.css so dark mode needs no extra work here). A
 * legend only renders for 2+ series - a single series is already named by
 * the section heading above the chart, per the accessibility rule that
 * identity is never color-alone once there's more than one to tell apart.
 */
export function ReportBarChart({
  data,
  categoryKey,
  series,
  valueFormatter,
  layout = 'horizontal',
  height = 320,
}: {
  data: Array<Record<string, unknown>>;
  categoryKey: string;
  series: ReportBarSeries[];
  valueFormatter?: (value: number) => string;
  /** 'vertical' draws horizontal bars (category down the Y axis) - use it when category labels are long. */
  layout?: 'horizontal' | 'vertical';
  height?: number;
}) {
  const isVertical = layout === 'vertical';
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
        <BarChart
          data={data}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="var(--border)" horizontal={!isVertical} vertical={isVertical} />
          {isVertical ? (
            <>
              <XAxis
                type="number"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={format}
                stroke="var(--border)"
              />
              <YAxis
                type="category"
                dataKey={categoryKey}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                width={160}
                stroke="var(--border)"
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={categoryKey}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                stroke="var(--border)"
              />
              <YAxis
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={format}
                stroke="var(--border)"
              />
            </>
          )}
          <Tooltip
            formatter={(value) => format(Number(value))}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
            }}
            labelStyle={{ color: 'var(--foreground)' }}
            cursor={{ fill: 'var(--muted)' }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }} />}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
