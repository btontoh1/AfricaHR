import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExpenseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  expenseDate!: string;

  @ApiProperty({ enum: ['COMPANY', 'EMPLOYEE'] })
  paidBy!: string;

  @ApiPropertyOptional({ description: 'Set only once an EMPLOYEE-paid expense has been reimbursed' })
  reimbursedAt?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  createdAt!: string;
}
