import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';

export class InvoiceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() subscriptionId!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() employeeCountAtIssue!: number;
  @ApiProperty({ enum: Object.values(InvoiceStatus) }) status!: InvoiceStatus;
  @ApiProperty() periodStart!: Date;
  @ApiProperty() periodEnd!: Date;
  @ApiProperty() dueDate!: Date;
  @ApiPropertyOptional({ nullable: true }) paidAt?: Date | null;
  @ApiPropertyOptional({ nullable: true }) checkoutUrl?: string | null;
}
