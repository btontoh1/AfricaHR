import { randomBytes } from 'node:crypto';
import { hashPinForLookup } from './pin-lookup-hash';

describe('hashPinForLookup', () => {
  const key = randomBytes(32);

  it('is deterministic - the same PIN and key always produce the same output', () => {
    expect(hashPinForLookup('1234', key)).toBe(hashPinForLookup('1234', key));
  });

  it('produces a different output for a different PIN', () => {
    expect(hashPinForLookup('1234', key)).not.toBe(hashPinForLookup('5678', key));
  });

  it('produces a different output under a different key', () => {
    const otherKey = randomBytes(32);
    expect(hashPinForLookup('1234', key)).not.toBe(hashPinForLookup('1234', otherKey));
  });
});
