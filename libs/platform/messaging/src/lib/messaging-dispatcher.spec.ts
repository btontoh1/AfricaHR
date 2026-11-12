import { LogMessagingDispatcher } from './messaging-dispatcher';

describe('LogMessagingDispatcher', () => {
  it('reports SMS success without sending anything real', async () => {
    const dispatcher = new LogMessagingDispatcher();

    const result = await dispatcher.sendSms('+233241234567', 'Your payslip is ready');

    expect(result).toEqual({ success: true });
  });

  it('reports WhatsApp success without sending anything real', async () => {
    const dispatcher = new LogMessagingDispatcher();

    const result = await dispatcher.sendWhatsApp('+233241234567', 'HX123', { net_pay: '832.00' });

    expect(result).toEqual({ success: true });
  });
});
