import { ApiProperty } from '@nestjs/swagger';

/**
 * Returned instead of AuthResponseDto when the account has MFA enabled -
 * no real tokens are issued yet. Exchange challengeToken + the current
 * code via POST /auth/mfa/verify for the real token pair.
 */
export class MfaChallengeResponseDto {
  @ApiProperty({ enum: [true] })
  mfaRequired!: true;

  @ApiProperty({ description: 'Short-lived (5 min) - present this plus a code to /auth/mfa/verify' })
  challengeToken!: string;
}
