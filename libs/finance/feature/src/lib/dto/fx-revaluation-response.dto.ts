import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FxRevaluationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  asOfDate!: string;

  @ApiProperty()
  rate!: string;

  @ApiPropertyOptional({ description: 'Null on the very first revaluation ever run for this organization/currency - it only establishes the baseline rate' })
  previousRate?: string | null;

  @ApiPropertyOptional({ description: 'Home-currency amount; null when previousRate is null, or 0 when no monetary balance in this currency existed as of asOfDate' })
  gainLoss?: string | null;

  @ApiPropertyOptional({ description: 'Null when nothing was posted (first run, or every monetary balance was zero)' })
  journalEntryId?: string | null;

  @ApiProperty()
  createdAt!: string;
}
