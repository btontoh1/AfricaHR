import { dedupeInFlight } from './dedupe-in-flight';

describe('dedupeInFlight', () => {
  it('collapses concurrent calls sharing a key into a single underlying call', async () => {
    let calls = 0;
    const fn = () => {
      calls += 1;
      return Promise.resolve(`result-${calls}`);
    };

    const [a, b, c] = await Promise.all([
      dedupeInFlight('token-1', fn),
      dedupeInFlight('token-1', fn),
      dedupeInFlight('token-1', fn),
    ]);

    expect(calls).toBe(1);
    expect(a).toBe('result-1');
    expect(b).toBe('result-1');
    expect(c).toBe('result-1');
  });

  it('calls fn independently for different keys', async () => {
    let calls = 0;
    const fn = () => {
      calls += 1;
      return Promise.resolve(calls);
    };

    const [a, b] = await Promise.all([
      dedupeInFlight('token-a', fn),
      dedupeInFlight('token-b', fn),
    ]);

    expect(calls).toBe(2);
    expect(a).not.toBe(b);
  });

  it('allows a fresh call once the in-flight one has settled', async () => {
    let calls = 0;
    const fn = () => {
      calls += 1;
      return Promise.resolve(calls);
    };

    const first = await dedupeInFlight('token-1', fn);
    const second = await dedupeInFlight('token-1', fn);

    expect(calls).toBe(2);
    expect(first).toBe(1);
    expect(second).toBe(2);
  });

  it('shares a rejection with every concurrent caller and still cleans up afterward', async () => {
    let calls = 0;
    const fn = () => {
      calls += 1;
      return Promise.reject(new Error('backend rejected'));
    };

    const results = await Promise.allSettled([
      dedupeInFlight('token-1', fn),
      dedupeInFlight('token-1', fn),
    ]);

    expect(calls).toBe(1);
    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('rejected');

    // Cleaned up after settling, so a later call tries again rather than
    // reusing the dead promise forever.
    let secondRoundCalls = 0;
    await dedupeInFlight('token-1', () => {
      secondRoundCalls += 1;
      return Promise.resolve('ok');
    });
    expect(secondRoundCalls).toBe(1);
  });
});
