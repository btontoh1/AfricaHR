import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminResetPasswordDto {
  @ApiProperty({ description: 'Must meet the platform password requirements.' })
  @IsString()
  newPassword!: string;
}
