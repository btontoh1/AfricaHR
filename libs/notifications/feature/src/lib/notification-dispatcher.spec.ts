import { LogNotificationDispatcher } from './notification-dispatcher';

describe('LogNotificationDispatcher', () => {
  it('reports success without sending anything real', async () => {
    const dispatcher = new LogNotificationDispatcher();

    const result = await dispatcher.dispatchEmail('ama@example.com', 'Subject', 'Body');

    expect(result).toEqual({ success: true });
  });
});
