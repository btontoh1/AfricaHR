import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: "The account's current password" })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ description: 'The new password to set. Must meet the platform password requirements.' })
  @IsString()
  newPassword!: string;
}
