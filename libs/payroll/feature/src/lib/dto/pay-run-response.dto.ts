import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayRunStatus } from '@prisma/client';

export class PayRunResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  periodStart!: string;

  @ApiProperty()
  periodEnd!: string;

  @ApiProperty()
  payDate!: string;

  @ApiProperty({ enum: Object.values(PayRunStatus) })
  status!: PayRunStatus;

  @ApiPropertyOptional()
  approvedAt?: string | null;

  @ApiPropertyOptional()
  paidAt?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
