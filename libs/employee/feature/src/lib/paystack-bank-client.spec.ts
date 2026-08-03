import { LogPaystackBankClient, RealPaystackBankClient } from './paystack-bank-client';

describe('LogPaystackBankClient', () => {
  it('returns the fallback Ghana bank list without contacting Paystack', async () => {
    const client = new LogPaystackBankClient();

    const result = await client.listBanks({ country: 'ghana', type: 'ghipss' });

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContainEqual({ name: 'GCB Bank', code: '040' });
  });

  it('returns the fallback Nigeria bank list when no type filter is given', async () => {
    const client = new LogPaystackBankClient();

    const result = await client.listBanks({ country: 'nigeria' });

    expect(result).toContainEqual({ name: 'Access Bank', code: '044' });
  });

  it('returns an empty list for a country/type combination with no fallback data', async () => {
    const client = new LogPaystackBankClient();

    const result = await client.listBanks({ country: 'kenya' });

    expect(result).toEqual([]);
  });
});

describe('RealPaystackBankClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches the bank list via the Paystack REST API', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({
        status: true,
        message: 'ok',
        data: [{ name: 'GCB Bank', code: '040' }],
      }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    const client = new RealPaystackBankClient('sk_test_key');

    const result = await client.listBanks({ country: 'ghana', type: 'ghipss' });

    expect(result).toEqual([{ name: 'GCB Bank', code: '040' }]);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.paystack.co/bank?country=ghana&type=ghipss',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer sk_test_key' }) }),
    );
  });

  it('omits the type param when none is given', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({ status: true, message: 'ok', data: [] }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    const client = new RealPaystackBankClient('sk_test_key');

    await client.listBanks({ country: 'nigeria' });

    expect(mockFetch).toHaveBeenCalledWith('https://api.paystack.co/bank?country=nigeria', expect.anything());
  });

  it('caches the result and does not re-fetch within the TTL', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({ status: true, message: 'ok', data: [{ name: 'GCB Bank', code: '040' }] }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;
    const client = new RealPaystackBankClient('sk_test_key');

    await client.listBanks({ country: 'ghana', type: 'ghipss' });
    await client.listBanks({ country: 'ghana', type: 'ghipss' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws when Paystack reports a non-success status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
      json: async () => ({ status: false, message: 'Invalid key' }),
    }) as unknown as typeof fetch;
    const client = new RealPaystackBankClient('sk_test_key');

    await expect(client.listBanks({ country: 'ghana', type: 'ghipss' })).rejects.toThrow(
      'Failed to fetch Paystack bank list: Invalid key',
    );
  });
});
