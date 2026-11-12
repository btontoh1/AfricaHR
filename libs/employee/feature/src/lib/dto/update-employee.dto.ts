import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompensationType, EmploymentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { FamilyMemberDto } from './family-member.dto';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Set to null to unassign the department', nullable: true })
  @IsOptional()
  @IsUUID()
  organizationUnitId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  gender?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  nationality?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsEmail()
  personalEmail?: string | null;

  @ApiPropertyOptional({
    type: [FamilyMemberDto],
    description:
      'Parents and children recorded on the employee profile. Replaces the full existing list when provided (including an empty array, which clears it) - omit to leave unchanged.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberDto)
  familyMembers?: FamilyMemberDto[];

  @ApiPropertyOptional({ enum: Object.values(EmploymentType) })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ example: 'GH' })
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter ISO 3166-1 alpha-2 code' })
  countryCode?: string;

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

  @ApiPropertyOptional({
    enum: Object.values(CompensationType),
    description: 'HOURLY requires hourlyRate instead of baseSalary.',
  })
  @IsOptional()
  @IsEnum(CompensationType)
  compensationType?: CompensationType;

  @ApiPropertyOptional({
    description: 'Required (and only used) when compensationType is HOURLY.',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number | null;

  @ApiPropertyOptional({ example: 'MONTHLY', nullable: true })
  @IsOptional()
  @IsString()
  payFrequency?: string | null;

  @ApiPropertyOptional({
    description: 'Annual rent paid - used only for Nigeria Rent Relief Allowance eligibility',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualRentPaid?: number | null;

  @ApiPropertyOptional({
    description: 'Send a payslip summary by SMS after each pay run is paid. Requires a valid E.164 phone number.',
  })
  @IsOptional()
  @IsBoolean()
  payslipSmsEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      "Send a payslip summary by WhatsApp after each pay run is paid. Requires a valid E.164 phone number, and the tenant's Twilio account to have a pre-approved message template configured.",
  })
  @IsOptional()
  @IsBoolean()
  payslipWhatsappEnabled?: boolean;
}
