import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResendMfaSmsDto {
  @ApiProperty({ description: 'The challengeToken returned from login when MFA is required' })
  @IsString()
  challengeToken!: string;
}
