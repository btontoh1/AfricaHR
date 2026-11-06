export interface SubscriptionStatusCount {
  status: string;
  count: number;
}

/**
 * Fixed lifecycle order (trial -> active -> past due -> cancelled), not
 * alphabetical - this is a funnel, so the order itself is meaningful. All
 * four statuses are always returned, even at zero, so the funnel's shape is
 * comparable across time rather than silently dropping empty stages.
 */
const STATUS_ORDER = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const;

export function summarizeSubscriptionsByStatus(subscriptions: { status: string }[]): SubscriptionStatusCount[] {
  const counts = new Map<string, number>();
  for (const subscription of subscriptions) {
    counts.set(subscription.status, (counts.get(subscription.status) ?? 0) + 1);
  }
  return STATUS_ORDER.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}
