import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HomeCurrencyResponseDto {
  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ description: 'Null if this organization has never had a home currency set - FX revaluation cannot run for it yet' })
  currency?: string | null;
}
