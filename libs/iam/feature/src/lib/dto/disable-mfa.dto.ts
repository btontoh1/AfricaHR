import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DisableMfaDto {
  @ApiProperty({ description: "The account's current password, required to disable MFA" })
  @IsString()
  password!: string;
}
