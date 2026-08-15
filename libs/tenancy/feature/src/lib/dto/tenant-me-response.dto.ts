import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { AddOnModule, PerformanceFramework } from '@prisma/client';

export class TenantMeResponseDto {
  @ApiProperty({ example: 'Acme Ghana Ltd' })
  name!: string;

  @ApiProperty({ example: 'acme-ghana-ltd' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Signed view URL for the uploaded business logo, or null if none set' })
  logoUrl?: string | null;

  @ApiProperty({ enum: Object.values(PerformanceFramework) })
  performanceFramework!: PerformanceFramework;

  @ApiProperty({ enum: Object.values(AddOnModule), isArray: true })
  enabledAddOns!: AddOnModule[];
}
