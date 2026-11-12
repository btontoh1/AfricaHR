import { PayRunDisbursedEvent } from './pay-run.service';
import { PayslipMessagingService } from './payslip-messaging.service';
import { PayRunMessagingListener } from './pay-run-messaging.listener';

describe('PayRunMessagingListener', () => {
  let listener: PayRunMessagingListener;
  let messaging: jest.Mocked<PayslipMessagingService>;

  const event: PayRunDisbursedEvent = {
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    payRunId: 'run-1',
    payDate: '2026-11-30',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-30',
    byCurrency: [],
  };

  beforeEach(() => {
    messaging = { sendForPayRun: jest.fn() } as unknown as jest.Mocked<PayslipMessagingService>;
    listener = new PayRunMessagingListener(messaging);
  });

  it('sends payslip messages for the disbursed pay run', async () => {
    messaging.sendForPayRun.mockResolvedValue(undefined);

    await listener.handlePayRunDisbursed(event);

    expect(messaging.sendForPayRun).toHaveBeenCalledWith('tenant-1', 'run-1');
  });

  it('swallows a failure rather than letting it propagate', async () => {
    messaging.sendForPayRun.mockRejectedValue(new Error('messaging down'));

    await expect(listener.handlePayRunDisbursed(event)).resolves.toBeUndefined();
  });
});
