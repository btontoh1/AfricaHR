import { ApiProperty } from '@nestjs/swagger';

export class ImpersonationTokenResponseDto {
  @ApiProperty({ description: 'Short-lived access token for the impersonated user - carries an `act` claim naming the acting admin.' })
  accessToken!: string;

  @ApiProperty({ description: 'No refresh token is issued for an impersonation session - once this expires, the session is simply over.' })
  expiresInSeconds!: number;
}
