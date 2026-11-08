import { createHmac } from 'node:crypto';
import { LogPaystackClient, RealPaystackClient } from './paystack-client';

describe('LogPaystackClient', () => {
  it('returns a placeholder checkout without contacting Paystack', async () => {
    const client = new LogPaystackClient();

    const result = await client.initializeTransaction({
      email: 'ama@example.com',
      amount: 500,
      currency: 'GHS',
      reference: 'ref-123',
    });

    expect(result.reference).toBe('ref-123');
    expect(result.authorizationUrl).toContain('ref-123');
  });

  it('never validates a webhook signature, since there is no real secret behind it', () => {
    const client = new LogPaystackClient();
    expect(client.verifyWebhookSignature('{}', 'anything')).toBe(false);
  });
});

describe('RealPaystackClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('initializes a transaction via the Paystack REST API', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({
        status: true,
        message: 'ok',
        data: {
          authorization_url: 'https://checkout.paystack.com/abc',
          access_code: 'access-code',
          reference: 'ref-123',
        },
      }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    const client = new RealPaystackClient('sk_test_key');

    const result = await client.initializeTransaction({
      email: 'ama@example.com',
      amount: 500,
      currency: 'GHS',
      reference: 'ref-123',
    });

    expect(result).toEqual({
      authorizationUrl: 'https://checkout.paystack.com/abc',
      accessCode: 'access-code',
      reference: 'ref-123',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.paystack.co/transaction/initialize',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer sk_test_key' }),
      }),
    );
    const [, requestInit] = mockFetch.mock.calls[0];
    expect(JSON.parse(requestInit.body)).toMatchObject({ amount: 50000, currency: 'GHS' });
  });

  it('throws when Paystack reports a non-success status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({ status: false, message: 'Invalid key' }),
    }) as unknown as typeof fetch;
    const client = new RealPaystackClient('sk_test_key');

    await expect(
      client.initializeTransaction({
        email: 'ama@example.com',
        amount: 500,
        currency: 'GHS',
        reference: 'ref-123',
      }),
    ).rejects.toThrow('Failed to initialize Paystack transaction: Invalid key');
  });

  it('verifies a webhook signature computed with the secret key', () => {
    const client = new RealPaystackClient('sk_test_key');
    const rawBody = JSON.stringify({ event: 'charge.success' });
    const signature = createHmac('sha512', 'sk_test_key').update(rawBody).digest('hex');

    expect(client.verifyWebhookSignature(rawBody, signature)).toBe(true);
    expect(client.verifyWebhookSignature(rawBody, 'wrong-signature')).toBe(false);
    expect(client.verifyWebhookSignature(rawBody, undefined)).toBe(false);
  });

  it('rejects a same-length but incorrect signature without throwing (constant-time comparison)', () => {
    const client = new RealPaystackClient('sk_test_key');
    const rawBody = JSON.stringify({ event: 'charge.success' });
    const signature = createHmac('sha512', 'sk_test_key').update(rawBody).digest('hex');
    // Flip the last hex character - same length as a real digest, so this
    // exercises timingSafeEqual's actual byte comparison rather than the
    // length-mismatch short-circuit above it.
    const almostRight = signature.slice(0, -1) + (signature.at(-1) === '0' ? '1' : '0');

    expect(client.verifyWebhookSignature(rawBody, almostRight)).toBe(false);
  });

  it('rejects a signature of the wrong length instead of throwing', () => {
    const client = new RealPaystackClient('sk_test_key');
    const rawBody = JSON.stringify({ event: 'charge.success' });

    expect(client.verifyWebhookSignature(rawBody, 'abcd')).toBe(false);
  });
});
