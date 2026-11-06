import { PaystackTransferClientRegistry } from './paystack-transfer-client-registry';
import { LogPaystackTransferClient, PaystackTransferClient } from './paystack-transfer-client';

describe('PaystackTransferClientRegistry', () => {
  it('returns the configured client for a known currency', () => {
    const ghsClient = { initiateTransfer: jest.fn() } as unknown as PaystackTransferClient;
    const registry = new PaystackTransferClientRegistry(new Map([['GHS', ghsClient]]));

    expect(registry.forCurrency('GHS')).toBe(ghsClient);
  });

  it('falls back to a log placeholder for an unconfigured currency', () => {
    const registry = new PaystackTransferClientRegistry(new Map());

    expect(registry.forCurrency('NGN')).toBeInstanceOf(LogPaystackTransferClient);
  });
});
