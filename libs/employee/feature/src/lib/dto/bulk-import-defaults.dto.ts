import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

/**
 * Fallback values applied to any row that leaves the matching CSV column
 * blank - see EmployeeBulkImportService.import. Lets an organization that
 * only has a plain name list (no per-employee job title/employment
 * type/hire date/country on hand) still bulk-import: set these once for
 * the whole batch instead of filling in four extra columns per row. A row
 * that does supply its own value always wins over the default.
 */
export class BulkImportDefaultsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  jobTitle?: string;

  @ApiPropertyOptional({ enum: Object.values(EmploymentType) })
  @IsOptional()
  @IsEnum(EmploymentType, {
    message: `employmentType must be one of: ${Object.values(EmploymentType).join(', ')}`,
  })
  employmentType?: EmploymentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'hireDate must be an ISO date (YYYY-MM-DD)' })
  hireDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter ISO 3166-1 alpha-2 code' })
  countryCode?: string;
}
