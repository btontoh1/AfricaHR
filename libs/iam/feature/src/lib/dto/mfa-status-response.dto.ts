import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class MfaStatusResponseDto {
  @ApiProperty({ description: 'Whether MFA is currently enabled on this account' })
  enabled!: boolean;

  @ApiPropertyOptional({ enum: ['TOTP', 'SMS'], description: 'Which method is active, when enabled' })
  method?: 'TOTP' | 'SMS';
}
