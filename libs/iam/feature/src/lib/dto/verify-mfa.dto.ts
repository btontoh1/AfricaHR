import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyMfaDto {
  @ApiProperty({ description: 'The challengeToken returned from login when MFA is required' })
  @IsString()
  challengeToken!: string;

  @ApiProperty({ example: '123456', description: 'A current 6-digit TOTP code, or a backup code (XXXXX-XXXXX)' })
  @IsString()
  code!: string;
}
