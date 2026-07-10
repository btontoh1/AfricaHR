import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobRequisitionStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class UpdateJobRequisitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hiringManagerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  openings?: number;

  @ApiPropertyOptional({ enum: Object.values(JobRequisitionStatus) })
  @IsOptional()
  @IsEnum(JobRequisitionStatus)
  status?: JobRequisitionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetHireDate?: string;
}
