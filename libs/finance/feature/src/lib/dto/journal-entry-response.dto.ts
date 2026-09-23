import { ApiProperty } from '@nestjs/swagger';

export class JournalEntryLineResponseDto {
  @ApiProperty()
  accountCode!: string;

  @ApiProperty()
  accountName!: string;

  @ApiProperty()
  debit!: string;

  @ApiProperty()
  credit!: string;
}

export class JournalEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  entryDate!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sourceType!: string;

  @ApiProperty()
  sourceId!: string;

  @ApiProperty({ type: JournalEntryLineResponseDto, isArray: true })
  lines!: JournalEntryLineResponseDto[];
}
