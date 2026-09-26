/**
 * (new + expansion) / (contraction + churn) for one currency/month - a
 * SaaS growth-efficiency metric: above 4 is excellent, 1-4 is sustainable
 * growth, below 1 means shrinking. Returns null when there was no
 * contraction or churn to divide by - not a bad result, just not a
 * meaningful ratio (nothing was lost to measure gains against).
 */
export function computeQuickRatio(gains: number, losses: number): number | null {
  if (losses <= 0) {
    return null;
  }
  return Math.round((gains / losses) * 100) / 100;
}
