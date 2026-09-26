'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { usePlatformSaasMetrics } from './queries';
import type { LtvToCacEntry } from './types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/** Matches the >=3 threshold the LTV:CAC card's own badge already uses. */
export const LTV_TO_CAC_HEALTHY_RATIO = 3;
/** Common SaaS guideline: CAC should be recouped within a year. */
export const CAC_PAYBACK_MAX_MONTHS = 12;

export function isLtvToCacUnhealthy(entry: LtvToCacEntry): boolean {
  return entry.ratio < LTV_TO_CAC_HEALTHY_RATIO || (entry.paybackMonths !== null && entry.paybackMonths > CAC_PAYBACK_MAX_MONTHS);
}

/**
 * A prominent warning when LTV:CAC (or CAC payback) is unhealthy for any
 * billed currency - unlike the LTV:CAC card's own success/warning badge,
 * which only shows up once you've navigated to SaaS Analytics and scrolled
 * to it, this surfaces the same signal as a callout wherever it's dropped
 * in (the platform admin dashboard and the top of SaaS Analytics).
 * Self-contained: fetches its own data, renders nothing while loading, on
 * error, or when there's nothing unhealthy to report.
 */
export function LtvToCacAlertBanner({ linkToAnalytics = true }: { linkToAnalytics?: boolean }) {
  const { data: metrics } = usePlatformSaasMetrics();

  if (!metrics) {
    return null;
  }

  const unhealthy = metrics.ltvToCac.filter(isLtvToCacUnhealthy);
  if (unhealthy.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>LTV:CAC needs attention</AlertTitle>
      <AlertDescription>
        <ul className="list-inside list-disc">
          {unhealthy.map((entry) => (
            <li key={entry.currency}>
              {entry.currency} — {entry.month}: {entry.ratio}:1 ratio
              {entry.paybackMonths !== null && `, ${entry.paybackMonths}mo CAC payback`}
              {entry.ratio < LTV_TO_CAC_HEALTHY_RATIO && ` (below the ${LTV_TO_CAC_HEALTHY_RATIO}:1 benchmark)`}
              {entry.paybackMonths !== null &&
                entry.paybackMonths > CAC_PAYBACK_MAX_MONTHS &&
                ` (over ${CAC_PAYBACK_MAX_MONTHS} months to recoup)`}
            </li>
          ))}
        </ul>
        {linkToAnalytics && (
          <Button variant="outline" size="sm" asChild className="mt-2">
            <Link href="/platform-admin/analytics">View SaaS Analytics</Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
