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
  currency!: string;

  @ApiProperty()
  sourceType!: string;

  @ApiProperty()
  sourceId!: string;

  @ApiProperty({ nullable: true, description: 'Set once this entry has been voided by a reversal.' })
  voidedAt!: string | null;

  @ApiProperty({ nullable: true, description: 'Set when this entry is itself the reversal of another.' })
  reversalOfId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ nullable: true, description: '"System" for automatic postings, the preparer\'s name for manual entries.' })
  preparedByName!: string | null;

  @ApiProperty({ nullable: true, description: 'Null until the (not yet built) approval workflow sets it.' })
  approvedAt!: string | null;

  @ApiProperty({ nullable: true })
  approvedByName!: string | null;

  @ApiProperty({ nullable: true })
  organizationUnitId!: string | null;

  @ApiProperty({ nullable: true, description: 'Department this entry is tagged with, if any.' })
  organizationUnitName!: string | null;

  @ApiProperty({ nullable: true })
  costCenterId!: string | null;

  @ApiProperty({ nullable: true })
  costCenterName!: string | null;

  @ApiProperty({ type: JournalEntryLineResponseDto, isArray: true })
  lines!: JournalEntryLineResponseDto[];
}
