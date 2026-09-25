import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateFixedAssetDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  description!: string;

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'Historical acquisition cost - posts Dr FIXED_ASSETS / Cr CASH_AND_BANK for this amount immediately' })
  @IsNumber()
  @Min(0.01)
  cost!: number;

  @ApiPropertyOptional({ default: 0, description: 'Estimated residual value at the end of usefulLifeMonths - depreciation never reduces the asset below this' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salvageValue?: number;

  @ApiProperty({ minimum: 1, description: 'Straight-line depreciation is spread evenly across this many months' })
  @IsInt()
  @Min(1)
  usefulLifeMonths!: number;

  @ApiProperty({ description: 'The depreciation posting day-of-month is derived from this date (capped at 28)' })
  @IsDateString()
  acquisitionDate!: string;
}
