/**
 * Months to recoup CAC from revenue alone (CAC / ARPU) - a simplification
 * that ignores gross margin, same posture as computeLtv's own ARPU-based
 * simplification. Returns null when there's no ARPU to recoup CAC from.
 */
export function computeCacPaybackMonths(cac: number, averageRevenuePerTenant: number): number | null {
  if (averageRevenuePerTenant <= 0) {
    return null;
  }
  return Math.round((cac / averageRevenuePerTenant) * 10) / 10;
}
