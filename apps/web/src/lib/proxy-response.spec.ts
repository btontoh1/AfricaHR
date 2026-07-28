/**
 * @jest-environment node
 *
 * next/server's NextResponse extends the platform's real Response class at
 * import time - jsdom (the project's default test environment, needed for
 * React component tests) doesn't provide that global, so this file
 * overrides to the node environment where it exists natively.
 */
import { toNextResponse } from './proxy-response';

/**
 * Regression test for a real bug: toNextResponse used to construct
 * `new NextResponse(body, { status })` where `body` was always the
 * awaited `backendResponse.text()` - `""` for a null-body backend
 * response, never `null`. The Fetch spec's Response constructor throws
 * for 204/205/304 unless body is strictly `null`, so this 500'd on
 * every null-body response ever routed through this proxy (caught via
 * live browser testing on MFA's disable and forget-devices endpoints,
 * and the payslip line-item delete endpoint - see project history).
 */
describe('toNextResponse', () => {
  it.each([204, 205, 304])('constructs a null body for a %i backend response, without throwing', async (status) => {
    const backendResponse = new Response(null, { status });

    const result = await toNextResponse(backendResponse);

    expect(result.status).toBe(status);
    expect(await result.text()).toBe('');
  });

  it('forwards the body and content-type for a normal 200 JSON response', async () => {
    const backendResponse = new Response(JSON.stringify({ foo: 'bar' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    const result = await toNextResponse(backendResponse);

    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ foo: 'bar' });
    expect(result.headers.get('content-type')).toContain('application/json');
  });

  it('forwards the body and status for an error response (e.g. 404)', async () => {
    const backendResponse = new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });

    const result = await toNextResponse(backendResponse);

    expect(result.status).toBe(404);
    expect(await result.json()).toEqual({ message: 'Not Found' });
  });
});
