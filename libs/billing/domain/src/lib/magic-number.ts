/**
 * Net-new MRR this month divided by the PRIOR month's acquisition spend -
 * the standard "magic number" timing convention (this period's growth is
 * attributed to the previous period's sales+marketing spend), adapted to
 * monthly rather than quarterly granularity since that's the only cadence
 * this platform's billing history supports. Above 0.75 is considered
 * capital-efficient. Returns null when no acquisition cost was entered for
 * the prior month.
 */
export function computeMagicNumber(netNewMrr: number, priorMonthAcquisitionCost: number): number | null {
  if (priorMonthAcquisitionCost <= 0) {
    return null;
  }
  return Math.round((netNewMrr / priorMonthAcquisitionCost) * 100) / 100;
}
