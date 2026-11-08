import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class SetOperatingCostDto {
  @ApiProperty({ example: '2026-01', description: 'Calendar month this cost covers' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be in YYYY-MM format' })
  month!: string;

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'Setting a cost again for the same month/currency overwrites this amount' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'Payroll, hosting, and tooling' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
