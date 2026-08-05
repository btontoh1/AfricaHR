import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisbursementNeedingAttentionDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiPropertyOptional({ nullable: true }) tenantName!: string | null;
  @ApiProperty() employeeId!: string;
  @ApiProperty() employeeFirstName!: string;
  @ApiProperty() employeeLastName!: string;
  @ApiProperty() payRunId!: string;
  @ApiProperty() periodStart!: Date;
  @ApiProperty() periodEnd!: Date;
  @ApiProperty() currency!: string;
  @ApiProperty() netPay!: number;
  @ApiProperty({ enum: ['PENDING', 'FAILED'] }) disbursementStatus!: 'PENDING' | 'FAILED';
  @ApiPropertyOptional({ nullable: true }) paystackTransferReference!: string | null;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({
    enum: ['STALE', 'CRITICAL', 'FAILED'],
    description:
      'STALE: PENDING past the 30-minute reconciliation threshold. CRITICAL: PENDING past the 24-hour threshold the reconciliation sweep alerts on. FAILED: the transfer resolved to failed/reversed and needs manual retry.',
  })
  severity!: 'STALE' | 'CRITICAL' | 'FAILED';
}

class DisbursementAttentionCountsDto {
  @ApiProperty() stale!: number;
  @ApiProperty() critical!: number;
  @ApiProperty() failed!: number;
}

export class DisbursementAttentionResponseDto {
  @ApiProperty({ type: [DisbursementNeedingAttentionDto] })
  items!: DisbursementNeedingAttentionDto[];

  @ApiProperty({ type: DisbursementAttentionCountsDto })
  counts!: DisbursementAttentionCountsDto;
}
