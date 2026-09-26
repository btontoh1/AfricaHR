import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

/** Shared shape for the acquisition-cost and cash-balance manual-entry endpoints. */
export class SetFinancialInputDto {
  @ApiProperty({ example: '2026-01', description: 'Calendar month this entry covers' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be in YYYY-MM format' })
  month!: string;

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'Setting an entry again for the same month/currency overwrites this amount' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
