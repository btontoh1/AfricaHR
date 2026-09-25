import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class SetBudgetDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ description: 'A GlAccount id from this tenant\'s chart of accounts' })
  @IsUUID()
  accountId!: string;

  @ApiProperty({ example: 2026, description: 'Calendar year (Jan 1 - Dec 31) - no custom fiscal-year-start support' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  fiscalYear!: number;

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'Setting a budget again for the same account/year/currency overwrites this amount' })
  @IsNumber()
  @Min(0)
  amount!: number;
}
