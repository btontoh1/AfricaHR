export interface CohortRetentionRow {
  /** The month a cohort's tenants first appeared - "YYYY-MM". */
  cohortMonth: string;
  cohortSize: number;
  /** Retention percent by months elapsed since the cohort month - index 0 is the cohort month itself (always 100). */
  retentionByMonthsElapsed: number[];
}

/**
 * Classic cohort retention grid: group tenants by their signup month, then
 * for each month after that, what percent of the cohort was still billed.
 * `activeTenantIdsByMonth` should already be restricted to whatever counts
 * as "billed" for this purpose (e.g. any non-cancelled invoice that month) -
 * this function only does the grouping and percentage math, not the
 * "what counts as active" judgment call.
 */
export function computeCohortRetention(
  tenantCohortMonths: Map<string, string>,
  activeTenantIdsByMonth: Map<string, Set<string>>,
  monthSequence: string[],
): CohortRetentionRow[] {
  const cohorts = new Map<string, string[]>();
  for (const [tenantId, cohortMonth] of tenantCohortMonths) {
    const tenantIds = cohorts.get(cohortMonth) ?? [];
    tenantIds.push(tenantId);
    cohorts.set(cohortMonth, tenantIds);
  }

  const rows: CohortRetentionRow[] = [];
  for (const cohortMonth of Array.from(cohorts.keys()).sort()) {
    const tenantIds = cohorts.get(cohortMonth);
    if (!tenantIds || tenantIds.length === 0) {
      continue;
    }
    const cohortIndex = monthSequence.indexOf(cohortMonth);
    if (cohortIndex === -1) {
      continue;
    }

    const cohortSize = tenantIds.length;
    const retentionByMonthsElapsed: number[] = [];
    for (let i = cohortIndex; i < monthSequence.length; i++) {
      const activeTenantIds = activeTenantIdsByMonth.get(monthSequence[i]) ?? new Set<string>();
      const retainedCount = tenantIds.filter((tenantId) => activeTenantIds.has(tenantId)).length;
      retentionByMonthsElapsed.push(Math.round((retainedCount / cohortSize) * 100));
    }

    rows.push({ cohortMonth, cohortSize, retentionByMonthsElapsed });
  }

  return rows;
}
