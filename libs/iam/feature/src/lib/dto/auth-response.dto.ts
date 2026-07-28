import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiPropertyOptional({
    description: 'Present only when the client asked to remember this device - store it for the X-Device-Token header on future logins',
  })
  deviceToken?: string;
}
