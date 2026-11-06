import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecurringJournalEntryLineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  accountId!: string;

  @ApiProperty()
  accountCode!: string;

  @ApiProperty()
  accountName!: string;

  @ApiProperty()
  debit!: string;

  @ApiProperty()
  credit!: string;
}

export class RecurringJournalEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  dayOfMonth!: number;

  @ApiProperty()
  startDate!: string;

  @ApiPropertyOptional()
  endDate?: string | null;

  @ApiProperty()
  nextRunDate!: string;

  @ApiPropertyOptional()
  lastRunDate?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: RecurringJournalEntryLineResponseDto, isArray: true })
  lines!: RecurringJournalEntryLineResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
