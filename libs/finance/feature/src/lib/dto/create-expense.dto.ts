import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

const EXPENSE_CATEGORIES = [
  'OFFICE_SUPPLIES',
  'TRAVEL',
  'UTILITIES',
  'MEALS_AND_ENTERTAINMENT',
  'PROFESSIONAL_SERVICES',
  'RENT',
  'OTHER',
] as const;

const EXPENSE_PAID_BY = ['COMPANY', 'EMPLOYEE'] as const;

export class CreateExpenseDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  description!: string;

  @ApiProperty({ enum: EXPENSE_CATEGORIES, description: 'A reporting tag only - every expense still posts to the one General Expense account' })
  @IsIn(EXPENSE_CATEGORIES)
  category!: (typeof EXPENSE_CATEGORIES)[number];

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty()
  @IsDateString()
  expenseDate!: string;

  @ApiProperty({
    enum: EXPENSE_PAID_BY,
    description: 'COMPANY credits Cash and Bank immediately; EMPLOYEE credits Expense Reimbursements Payable until reimbursed',
  })
  @IsIn(EXPENSE_PAID_BY)
  paidBy!: (typeof EXPENSE_PAID_BY)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;
}
