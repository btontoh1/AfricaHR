import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PeriodCloseResponseDto {
  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({
    description: 'Null if this organization has never been closed - every manual entry date is postable/voidable',
  })
  closedThrough?: string | null;

  @ApiPropertyOptional()
  closedAt?: string | null;

  @ApiPropertyOptional()
  closedBy?: string | null;
}
