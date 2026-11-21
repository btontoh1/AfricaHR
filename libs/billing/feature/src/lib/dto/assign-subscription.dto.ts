import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, Min } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty({
    example: 10,
    description:
      'Monthly price per active employee beyond includedEmployeeCount (see that field) - the only charge for a pure per-seat tenant with no flat fee set.',
  })
  @IsNumber()
  @IsPositive()
  pricePerEmployee!: number;

  @ApiProperty({ example: 'GHS', description: 'ISO 4217 currency code' })
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
  currency!: string;

  @ApiPropertyOptional({
    example: 499,
    description:
      'A fixed charge per billing period, independent of headcount - set this to put the tenant on a flat-rate plan instead of pure per-employee billing. Omit or 0 for pure per-seat billing.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  flatFeeAmount?: number;

  @ApiPropertyOptional({
    example: 10,
    description:
      'How many employees flatFeeAmount already covers before pricePerEmployee starts applying to the remainder. Omit or 0 if every employee should be charged pricePerEmployee.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedEmployeeCount?: number;
}
