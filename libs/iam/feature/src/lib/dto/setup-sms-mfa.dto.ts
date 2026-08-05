import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SetupSmsMfaDto {
  @ApiProperty({
    example: '+233201234567',
    description: 'E.164 format (leading +, country code, no spaces or punctuation)',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phoneNumber must be in E.164 format, e.g. +233201234567' })
  phoneNumber!: string;
}
