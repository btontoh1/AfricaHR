import { NextRequest, NextResponse } from 'next/server';

/**
 * Dedicated proxy route for the Paystack webhook — the generic catch-all
 * proxy (api/[...path]/route.ts) only forwards Content-Type and
 * Authorization headers, which would silently strip Paystack's
 * `x-paystack-signature` header and break signature verification on the
 * backend. Paystack calls this directly (no browser session), so unlike
 * the catch-all proxy there is no access-token cookie to attach and no
 * 401-refresh-retry dance - just a faithful forward of the raw body and
 * signature header.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  const response = await fetch(`${process.env.API_BASE_URL}/webhooks/paystack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(signature ? { 'x-paystack-signature': signature } : {}),
    },
    body: rawBody,
  });

  const body = await response.text();
  return new NextResponse(body, { status: response.status });
}
