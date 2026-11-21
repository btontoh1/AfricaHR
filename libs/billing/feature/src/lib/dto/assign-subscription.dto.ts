import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { BillingInterval } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, Min } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty({
    example: 10,
    description:
      'Price per active employee beyond includedEmployeeCount (see that field), for one full billing period (see billingInterval) - the only charge for a pure per-seat tenant with no flat fee set.',
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
      'A fixed charge per billing period (see billingInterval), independent of headcount - set this to put the tenant on a flat-rate plan instead of pure per-employee billing. Omit or 0 for pure per-seat billing. This is the FULL charge for one period - an ANNUAL tenant on 499 is charged 499 once a year, not per month.',
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

  @ApiPropertyOptional({
    enum: BillingInterval,
    example: BillingInterval.MONTHLY,
    description:
      'How often this subscription is invoiced and its period advances - MONTHLY (the default) or ANNUAL, where one period spans 12 months.',
  })
  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;
}
