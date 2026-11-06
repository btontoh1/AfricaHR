import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString, IsUUID, Length } from 'class-validator';

export class CreateBankReconciliationDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'The bank statement date - every Cash and Bank line on or before this date is eligible to clear' })
  @IsDateString()
  statementDate!: string;

  @ApiProperty({ description: "The bank statement's own ending balance - what the reconciliation's cleared lines must sum to before it can be completed" })
  @IsNumber()
  statementEndingBalance!: number;
}
