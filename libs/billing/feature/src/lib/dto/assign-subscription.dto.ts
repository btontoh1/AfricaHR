import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, Matches } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty({ example: 10, description: 'Monthly price per active employee' })
  @IsNumber()
  @IsPositive()
  pricePerEmployee!: number;

  @ApiProperty({ example: 'GHS', description: 'ISO 4217 currency code' })
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
  currency!: string;
}
