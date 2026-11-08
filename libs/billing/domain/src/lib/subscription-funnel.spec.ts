import { summarizeSubscriptionsByStatus } from './subscription-funnel';

describe('summarizeSubscriptionsByStatus', () => {
  it('counts subscriptions per status in fixed lifecycle order', () => {
    const result = summarizeSubscriptionsByStatus([
      { status: 'ACTIVE' },
      { status: 'TRIALING' },
      { status: 'ACTIVE' },
      { status: 'CANCELLED' },
    ]);

    expect(result).toEqual([
      { status: 'TRIALING', count: 1 },
      { status: 'ACTIVE', count: 2 },
      { status: 'PAST_DUE', count: 0 },
      { status: 'CANCELLED', count: 1 },
    ]);
  });

  it('returns all four statuses at zero when there are no subscriptions', () => {
    expect(summarizeSubscriptionsByStatus([])).toEqual([
      { status: 'TRIALING', count: 0 },
      { status: 'ACTIVE', count: 0 },
      { status: 'PAST_DUE', count: 0 },
      { status: 'CANCELLED', count: 0 },
    ]);
  });
});
