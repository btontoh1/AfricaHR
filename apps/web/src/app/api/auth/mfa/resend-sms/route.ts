import { NextRequest, NextResponse } from 'next/server';
import { createBackendClient } from '@/lib/backend-client';

// Pre-session (only a challengeToken, no cookies yet) - same posture as
// auth/mfa/verify, but this one issues no tokens on success, just a plain
// pass/fail for whether a new SMS code went out.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = createBackendClient();
  const { error, response } = await client.POST('/api/auth/mfa/resend-sms', { body });

  if (error) {
    const status = (response as Response).status;
    return NextResponse.json(error, { status });
  }

  return new NextResponse(null, { status: 204 });
}
