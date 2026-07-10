import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStage } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class AdvanceApplicationDto {
  @ApiProperty({ enum: Object.values(ApplicationStage) })
  @IsEnum(ApplicationStage)
  stage!: ApplicationStage;

  @ApiPropertyOptional({ description: 'Required when stage is REJECTED' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  rejectionReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
