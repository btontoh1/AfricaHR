import { PaystackClientRegistry } from './paystack-client-registry';
import { LogPaystackClient, PaystackClient } from './paystack-client';

describe('PaystackClientRegistry', () => {
  it('returns the configured client for a known currency', () => {
    const ghsClient = { initializeTransaction: jest.fn() } as unknown as PaystackClient;
    const registry = new PaystackClientRegistry(new Map([['GHS', ghsClient]]), new Set(['GHS']));

    expect(registry.forCurrency('GHS')).toBe(ghsClient);
  });

  it('falls back to a log placeholder for an unconfigured currency', () => {
    const registry = new PaystackClientRegistry(new Map(), new Set());

    expect(registry.forCurrency('NGN')).toBeInstanceOf(LogPaystackClient);
  });

  describe('isConfigured', () => {
    it('reports true only for currencies with a real account configured', () => {
      const registry = new PaystackClientRegistry(new Map(), new Set(['GHS']));

      expect(registry.isConfigured('GHS')).toBe(true);
      expect(registry.isConfigured('NGN')).toBe(false);
    });
  });

  describe('hasAnyConfigured', () => {
    it('is false when no currency has a real account configured (local/dev/CI)', () => {
      const registry = new PaystackClientRegistry(new Map(), new Set());

      expect(registry.hasAnyConfigured()).toBe(false);
    });

    it('is true once at least one currency has a real account configured', () => {
      const registry = new PaystackClientRegistry(new Map(), new Set(['GHS']));

      expect(registry.hasAnyConfigured()).toBe(true);
    });
  });
});
