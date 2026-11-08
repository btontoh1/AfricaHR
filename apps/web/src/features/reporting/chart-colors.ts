/**
 * Fixed categorical order (colorblind-safe, validated against both light
 * and dark chart surfaces) - assign by position, never reassign per-filter.
 * Backed by CSS custom properties (see global.css) so each series stays
 * correct across the light/dark theme toggle without extra JS.
 */
export const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'] as const;
