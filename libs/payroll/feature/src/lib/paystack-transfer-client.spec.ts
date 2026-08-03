import { LogPaystackTransferClient, RealPaystackTransferClient } from './paystack-transfer-client';

describe('LogPaystackTransferClient', () => {
  it('returns a placeholder recipient code without contacting Paystack', async () => {
    const client = new LogPaystackTransferClient();

    const result = await client.createRecipient({
      type: 'ghipss',
      name: 'Kwame Asante',
      accountNumber: '1234567890',
      bankCode: '040',
      currency: 'GHS',
    });

    expect(result.recipientCode).toMatch(/^RCP_placeholder_/);
  });

  it('returns a placeholder transfer code without moving real money', async () => {
    const client = new LogPaystackTransferClient();

    const result = await client.initiateTransfer({
      amount: 500,
      currency: 'GHS',
      recipientCode: 'RCP_placeholder_1',
      reference: 'ref-123',
    });

    expect(result.transferCode).toMatch(/^TRF_placeholder_/);
    expect(result.reference).toBe('ref-123');
    expect(result.status).toBe('pending');
  });

  it('reports a placeholder transfer as immediately successful, so a reconciliation sweep has something to resolve', async () => {
    const client = new LogPaystackTransferClient();

    const result = await client.verifyTransfer('ref-123');

    expect(result).toEqual({ status: 'success' });
  });
});

describe('RealPaystackTransferClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('creates a transfer recipient via the Paystack REST API', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({ status: true, message: 'ok', data: { recipient_code: 'RCP_abc' } }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    const client = new RealPaystackTransferClient('sk_test_key');

    const result = await client.createRecipient({
      type: 'ghipss',
      name: 'Kwame Asante',
      accountNumber: '1234567890',
      bankCode: '040',
      currency: 'GHS',
    });

    expect(result).toEqual({ recipientCode: 'RCP_abc' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.paystack.co/transferrecipient',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer sk_test_key' }),
      }),
    );
    const [, requestInit] = mockFetch.mock.calls[0];
    expect(JSON.parse(requestInit.body)).toMatchObject({
      type: 'ghipss',
      account_number: '1234567890',
      bank_code: '040',
    });
  });

  it('throws when Paystack reports a non-success status creating a recipient', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({ status: false, message: 'Invalid bank code' }),
    }) as unknown as typeof fetch;
    const client = new RealPaystackTransferClient('sk_test_key');

    await expect(
      client.createRecipient({
        type: 'ghipss',
        name: 'Kwame Asante',
        accountNumber: '1234567890',
        bankCode: 'bad-code',
        currency: 'GHS',
      }),
    ).rejects.toThrow('Failed to create Paystack transfer recipient: Invalid bank code');
  });

  it('initiates a transfer via the Paystack REST API, converting to the smallest currency unit', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({
        status: true,
        message: 'ok',
        data: { transfer_code: 'TRF_abc', reference: 'ref-123', status: 'pending' },
      }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    const client = new RealPaystackTransferClient('sk_test_key');

    const result = await client.initiateTransfer({
      amount: 500,
      currency: 'GHS',
      recipientCode: 'RCP_abc',
      reference: 'ref-123',
    });

    expect(result).toEqual({ transferCode: 'TRF_abc', reference: 'ref-123', status: 'pending' });
    const [, requestInit] = mockFetch.mock.calls[0];
    expect(JSON.parse(requestInit.body)).toMatchObject({ amount: 50000, currency: 'GHS', recipient: 'RCP_abc' });
  });

  it('throws when Paystack reports a non-success status initiating a transfer', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({ status: false, message: 'Insufficient balance' }),
    }) as unknown as typeof fetch;
    const client = new RealPaystackTransferClient('sk_test_key');

    await expect(
      client.initiateTransfer({
        amount: 500,
        currency: 'GHS',
        recipientCode: 'RCP_abc',
        reference: 'ref-123',
      }),
    ).rejects.toThrow('Failed to initiate Paystack transfer: Insufficient balance');
  });

  it('verifies a transfer via the Paystack REST API', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({ status: true, message: 'ok', data: { status: 'success' } }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    const client = new RealPaystackTransferClient('sk_test_key');

    const result = await client.verifyTransfer('ref-123');

    expect(result).toEqual({ status: 'success' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.paystack.co/transfer/verify/ref-123',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer sk_test_key' }) }),
    );
  });

  it('throws when Paystack reports a non-success status verifying a transfer', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({ status: false, message: 'Transfer not found' }),
    }) as unknown as typeof fetch;
    const client = new RealPaystackTransferClient('sk_test_key');

    await expect(client.verifyTransfer('unknown-ref')).rejects.toThrow(
      'Failed to verify Paystack transfer: Transfer not found',
    );
  });
});
