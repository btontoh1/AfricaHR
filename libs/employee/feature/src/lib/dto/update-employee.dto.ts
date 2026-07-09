import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Set to null to unassign the department' })
  @IsOptional()
  @IsUUID()
  organizationUnitId?: string | null;

  @ApiPropertyOptional({ description: 'Set to null to clear the reporting manager' })
  @IsOptional()
  @IsUUID()
  managerId?: string | null;

  @ApiPropertyOptional({ description: 'Link or unlink (set null) portal access for this employee' })
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number | null;

  @ApiPropertyOptional({ example: 'MONTHLY' })
  @IsOptional()
  @IsString()
  payFrequency?: string | null;
}
