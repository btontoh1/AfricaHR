import { ApiProperty } from '@nestjs/swagger';
import { PerformanceFramework } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdatePerformanceFrameworkDto {
  @ApiProperty({ enum: Object.values(PerformanceFramework) })
  @IsEnum(PerformanceFramework)
  performanceFramework!: PerformanceFramework;
}
