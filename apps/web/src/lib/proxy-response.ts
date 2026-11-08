import { NextResponse } from 'next/server';

// Null-body statuses (204/205/304) must construct with a literal `null`
// body, never an empty string - the Fetch spec's Response constructor
// throws "Invalid response status code" for any of these three statuses
// if body isn't strictly null, even a zero-length string.
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

/**
 * Rebuilds a backend fetch Response as a NextResponse, forwarding
 * status/body/content-type/content-disposition. Reads the body as an
 * ArrayBuffer, not text - a UTF-8 text round-trip corrupts any binary
 * response (e.g. InvoicePdfService's generated PDFs), and works identically
 * to the old text() behavior for JSON/text bodies since NextResponse
 * accepts either as a body.
 */
export async function toNextResponse(backendResponse: Response): Promise<NextResponse> {
  if (NULL_BODY_STATUSES.has(backendResponse.status)) {
    return new NextResponse(null, { status: backendResponse.status });
  }

  const body = await backendResponse.arrayBuffer();
  const contentDisposition = backendResponse.headers.get('content-disposition');
  return new NextResponse(body, {
    status: backendResponse.status,
    headers: {
      'Content-Type': backendResponse.headers.get('content-type') ?? 'application/json',
      ...(contentDisposition ? { 'Content-Disposition': contentDisposition } : {}),
    },
  });
}
