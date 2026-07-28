import { ApiProperty } from '@nestjs/swagger';

export class MfaStatusResponseDto {
  @ApiProperty({ description: 'Whether MFA is currently enabled on this account' })
  enabled!: boolean;
}
