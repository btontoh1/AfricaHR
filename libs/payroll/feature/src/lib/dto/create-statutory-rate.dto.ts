import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutoryRateCode } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, Matches, Min } from 'class-validator';

export class CreateStatutoryRateDto {
  @ApiProperty({ example: 'GH', description: 'ISO 3166-1 alpha-2 country code' })
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter ISO 3166-1 alpha-2 code' })
  countryCode!: string;

  @ApiProperty({ enum: Object.values(StatutoryRateCode) })
  @IsEnum(StatutoryRateCode)
  code!: StatutoryRateCode;

  @ApiProperty({ example: 0.055, description: 'Fraction, e.g. 0.055 for 5.5%' })
  @IsNumber()
  @Min(0)
  rate!: number;

  @ApiProperty()
  @IsDateString()
  effectiveFrom!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
