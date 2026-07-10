import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Set to null to unassign the department', nullable: true })
  @IsOptional()
  @IsUUID()
  organizationUnitId?: string | null;

  @ApiPropertyOptional({ description: 'Set to null to clear the reporting manager', nullable: true })
  @IsOptional()
  @IsUUID()
  managerId?: string | null;

  @ApiPropertyOptional({
    description: 'Link or unlink (set null) portal access for this employee',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  jobTitle?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number | null;

  @ApiPropertyOptional({ example: 'MONTHLY', nullable: true })
  @IsOptional()
  @IsString()
  payFrequency?: string | null;
}
