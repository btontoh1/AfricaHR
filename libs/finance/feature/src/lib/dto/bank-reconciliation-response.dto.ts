import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BankReconciliationStatus } from '@prisma/client';

export class BankReconciliationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  statementDate!: string;

  @ApiProperty()
  statementEndingBalance!: string;

  @ApiProperty({ enum: BankReconciliationStatus })
  status!: BankReconciliationStatus;

  @ApiPropertyOptional()
  completedAt?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class BankReconciliationLineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  entryDate!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  debit!: string;

  @ApiProperty()
  credit!: string;

  @ApiProperty({ description: 'Whether this line is cleared in this reconciliation' })
  cleared!: boolean;
}

export class BankReconciliationDetailResponseDto extends BankReconciliationResponseDto {
  @ApiProperty({
    type: BankReconciliationLineResponseDto,
    isArray: true,
    description: 'Every Cash and Bank line on or before the statement date that is unclaimed or claimed by this reconciliation',
  })
  lines!: BankReconciliationLineResponseDto[];

  @ApiProperty({ description: 'Net balance of every line currently marked cleared' })
  clearedBalance!: number;

  @ApiProperty({ description: 'clearedBalance - statementEndingBalance - zero when balanced' })
  difference!: number;

  @ApiProperty()
  isBalanced!: boolean;
}
