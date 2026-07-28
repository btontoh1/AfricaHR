import { NextResponse } from 'next/server';

// Null-body statuses (204/205/304) must construct with a literal `null`
// body, never an empty string - the Fetch spec's Response constructor
// throws "Invalid response status code" for any of these three statuses
// if body isn't strictly null, even a zero-length string.
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

/** Rebuilds a backend fetch Response as a NextResponse, forwarding status/body/content-type. */
export async function toNextResponse(backendResponse: Response): Promise<NextResponse> {
  if (NULL_BODY_STATUSES.has(backendResponse.status)) {
    return new NextResponse(null, { status: backendResponse.status });
  }

  const body = await backendResponse.text();
  return new NextResponse(body, {
    status: backendResponse.status,
    headers: { 'Content-Type': backendResponse.headers.get('content-type') ?? 'application/json' },
  });
}
