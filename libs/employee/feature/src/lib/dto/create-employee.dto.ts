import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompensationType, EmploymentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { FamilyMemberDto } from './family-member.dto';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationUnitId?: string;

  @ApiPropertyOptional({ description: 'Reporting manager' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({
    description:
      'Existing User (IAM) id to link for portal access. Omit to create an HR-only record with no login — a link can be added later via update.',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    example: 'EMP-0001',
    description: 'Auto-generated (EMP-NNNN) if omitted',
  })
  @IsOptional()
  @Matches(/^[A-Z]{2,6}-\d{4,}$/)
  employeeNumber?: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiPropertyOptional({
    type: [FamilyMemberDto],
    description: 'Parents and children recorded on the employee profile',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberDto)
  familyMembers?: FamilyMemberDto[];

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @Length(1, 200)
  jobTitle!: string;

  @ApiProperty({ enum: Object.values(EmploymentType) })
  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @ApiProperty()
  @IsDateString()
  hireDate!: string;

  @ApiPropertyOptional({
    enum: Object.values(CompensationType),
    description: 'Defaults to SALARY when omitted. HOURLY requires hourlyRate instead of baseSalary.',
  })
  @IsOptional()
  @IsEnum(CompensationType)
  compensationType?: CompensationType;

  @ApiPropertyOptional({
    description: 'Required (and only used) when compensationType is HOURLY - priced against attendance-derived hours worked each pay run instead of baseSalary.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @ApiPropertyOptional({ example: 'MONTHLY' })
  @IsOptional()
  @IsString()
  payFrequency?: string;

  @ApiPropertyOptional({ example: 'GHS' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Annual rent paid - used only for Nigeria Rent Relief Allowance eligibility',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualRentPaid?: number;

  @ApiProperty({ example: 'GH' })
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter ISO 3166-1 alpha-2 code' })
  countryCode!: string;

  @ApiPropertyOptional({ example: { ghanaCardNumber: 'GHA-123456789-0' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Send a payslip summary by SMS after each pay run is paid. Requires a valid E.164 phone number.',
  })
  @IsOptional()
  @IsBoolean()
  payslipSmsEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      "Send a payslip summary by WhatsApp after each pay run is paid. Requires a valid E.164 phone number, and the tenant's Twilio account to have a pre-approved message template configured - until then, sends are skipped rather than attempted.",
  })
  @IsOptional()
  @IsBoolean()
  payslipWhatsappEnabled?: boolean;
}
