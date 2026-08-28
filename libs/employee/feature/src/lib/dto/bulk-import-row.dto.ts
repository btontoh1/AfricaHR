import { EmploymentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

/**
 * One CSV row, mirrored against CreateEmployeeDto's core fields - see
 * BulkImportEmployeesDto for why organizationUnitId/managerId/familyMembers
 * aren't here. class-validator runs against this per row (see
 * EmployeeBulkImportService), separately from CreateEmployeeDto so a CSV
 * column layout change doesn't have to track the full create DTO.
 */
export class BulkImportRowDto {
  @IsOptional()
  @Matches(/^[A-Z]{2,6}-\d{4,}$/, { message: 'employeeNumber must look like EMP-0001' })
  employeeNumber?: string;

  @IsString({ message: 'firstName is required' })
  @Length(1, 100)
  firstName!: string;

  @IsString({ message: 'lastName is required' })
  @Length(1, 100)
  lastName!: string;

  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth must be an ISO date (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'personalEmail is not a valid email address' })
  personalEmail?: string;

  @IsString({ message: 'jobTitle is required' })
  @Length(1, 200)
  jobTitle!: string;

  @IsEnum(EmploymentType, {
    message: `employmentType must be one of: ${Object.values(EmploymentType).join(', ')}`,
  })
  employmentType!: EmploymentType;

  @IsDateString({}, { message: 'hireDate is required and must be an ISO date (YYYY-MM-DD)' })
  hireDate!: string;

  // CSV cells are always strings - Type() converts the cell to a number
  // before IsNumber runs, same as a form field would be coerced client-side.
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'baseSalary must be a number' })
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsString()
  payFrequency?: string;

  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
  currency?: string;

  @Matches(/^[A-Z]{2}$/, { message: 'countryCode is required and must be a 2-letter ISO 3166-1 alpha-2 code' })
  countryCode!: string;
}
