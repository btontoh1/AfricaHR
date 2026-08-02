import sgMail = require('@sendgrid/mail');
import { LogNotificationDispatcher, SendGridNotificationDispatcher } from './notification-dispatcher';

// @sendgrid/mail is a CommonJS `export =` module (see notification-dispatcher.ts) -
// the mock factory's return value is what `require(...)` resolves to directly,
// no __esModule/default wrapper needed.
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

describe('LogNotificationDispatcher', () => {
  it('reports success without sending anything real', async () => {
    const dispatcher = new LogNotificationDispatcher();

    const result = await dispatcher.dispatchEmail('ama@example.com', 'Subject', 'Body');

    expect(result).toEqual({ success: true });
  });
});

describe('SendGridNotificationDispatcher', () => {
  const mockedSgMail = sgMail as unknown as { setApiKey: jest.Mock; send: jest.Mock };

  beforeEach(() => {
    mockedSgMail.setApiKey.mockClear();
    mockedSgMail.send.mockClear();
  });

  it('sets the API key on construction', () => {
    new SendGridNotificationDispatcher('sg-key', 'noreply@parothr.com');

    expect(mockedSgMail.setApiKey).toHaveBeenCalledWith('sg-key');
  });

  it('sends a plain-text email via SendGrid and reports success', async () => {
    mockedSgMail.send.mockResolvedValue([{}, {}]);
    const dispatcher = new SendGridNotificationDispatcher('sg-key', 'noreply@parothr.com');

    const result = await dispatcher.dispatchEmail('ama@example.com', 'Subject', 'Body');

    expect(mockedSgMail.send).toHaveBeenCalledWith({
      to: 'ama@example.com',
      from: 'noreply@parothr.com',
      subject: 'Subject',
      text: 'Body',
    });
    expect(result).toEqual({ success: true });
  });

  it('reports failure with the error message when SendGrid rejects, rather than throwing', async () => {
    mockedSgMail.send.mockRejectedValue(new Error('Unauthorized'));
    const dispatcher = new SendGridNotificationDispatcher('sg-key', 'noreply@parothr.com');

    const result = await dispatcher.dispatchEmail('ama@example.com', 'Subject', 'Body');

    expect(result).toEqual({ success: false, failureReason: 'Unauthorized' });
  });
});
