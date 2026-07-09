import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentStatus } from '@africahr/employee-domain';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class UpdateEmploymentStatusDto {
  @ApiProperty({ enum: Object.values(EmploymentStatus) })
  @IsEnum(EmploymentStatus)
  status!: EmploymentStatus;

  @ApiPropertyOptional({
    description: 'Required (defaults to now) when status is TERMINATED',
  })
  @IsOptional()
  @IsDateString()
  terminationDate?: string;
}
