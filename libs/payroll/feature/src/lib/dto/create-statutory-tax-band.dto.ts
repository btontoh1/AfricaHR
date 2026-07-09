import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, Matches, Min } from 'class-validator';

export class CreateStatutoryTaxBandDto {
  @ApiProperty({ example: 'GH', description: 'ISO 3166-1 alpha-2 country code' })
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter ISO 3166-1 alpha-2 code' })
  countryCode!: string;

  @ApiProperty({ example: 1, description: 'Ascending band order; band 1 is the lowest' })
  @IsInt()
  @Min(1)
  order!: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  lowerBound!: number;

  @ApiPropertyOptional({ example: 500, description: 'Omit for the unbounded top band' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  upperBound?: number;

  @ApiProperty({ example: 0.25, description: 'Fraction, e.g. 0.25 for 25%' })
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
