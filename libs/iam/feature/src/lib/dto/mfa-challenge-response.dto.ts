import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    enum: ['TOTP', 'SMS'],
    description: 'Which method to prompt for - TOTP shows a plain code field, SMS shows "we texted you a code" plus a resend option',
  })
  mfaMethod!: 'TOTP' | 'SMS';

  @ApiPropertyOptional({ description: 'Last 4 digits of the phone number a code was just sent to, when mfaMethod is SMS' })
  phoneLast4?: string;
}
