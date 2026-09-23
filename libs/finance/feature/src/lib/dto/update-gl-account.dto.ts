import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateGlAccountDto {
  @ApiProperty({ description: 'Display name only - the account code and type are fixed.' })
  @IsString()
  @Length(1, 100)
  name!: string;
}
