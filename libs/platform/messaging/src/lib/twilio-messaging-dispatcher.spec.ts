import { TwilioMessagingDispatcher } from './twilio-messaging-dispatcher';

const mockCreate = jest.fn();

// twilio is a CommonJS `export =` module (a callable function) - the mock
// factory's return value is what `require('twilio')` resolves to directly,
// same posture as @sendgrid/mail's mock in notification-dispatcher.spec.ts.
jest.mock('twilio', () => jest.fn(() => ({ messages: { create: mockCreate } })));

describe('TwilioMessagingDispatcher', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('sends an SMS via Twilio and reports success', async () => {
    mockCreate.mockResolvedValue({ sid: 'SM123' });
    const dispatcher = new TwilioMessagingDispatcher('AC123', 'auth-token', '+18005551234');

    const result = await dispatcher.sendSms('+233241234567', 'Your payslip is ready');

    expect(mockCreate).toHaveBeenCalledWith({
      from: '+18005551234',
      to: '+233241234567',
      body: 'Your payslip is ready',
    });
    expect(result).toEqual({ success: true });
  });

  it('reports SMS failure with the error message rather than throwing', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid number'));
    const dispatcher = new TwilioMessagingDispatcher('AC123', 'auth-token', '+18005551234');

    const result = await dispatcher.sendSms('+233241234567', 'Your payslip is ready');

    expect(result).toEqual({ success: false, error: 'Invalid number' });
  });

  it('sends a WhatsApp template message with the whatsapp: prefix and contentVariables', async () => {
    mockCreate.mockResolvedValue({ sid: 'SM456' });
    const dispatcher = new TwilioMessagingDispatcher('AC123', 'auth-token', '+18005551234', '+18005559999');

    const result = await dispatcher.sendWhatsApp('+233241234567', 'HX123', { net_pay: '832.00' });

    expect(mockCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+18005559999',
      to: 'whatsapp:+233241234567',
      contentSid: 'HX123',
      contentVariables: JSON.stringify({ net_pay: '832.00' }),
    });
    expect(result).toEqual({ success: true });
  });

  it('reports a clear failure when no WhatsApp sender is configured, without calling Twilio', async () => {
    const dispatcher = new TwilioMessagingDispatcher('AC123', 'auth-token', '+18005551234');

    const result = await dispatcher.sendWhatsApp('+233241234567', 'HX123', {});

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, error: 'TWILIO_WHATSAPP_FROM is not configured' });
  });
});
