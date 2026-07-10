import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentStatus, EmploymentType } from '@prisma/client';

// Documents the response shape for Swagger/OpenAPI-client codegen only —
// EmployeeService returns the Prisma entity directly (no serialization
// interceptor), so this intentionally covers the fields a consumer needs,
// not every DB column (audit fields like deletedAt/createdBy/updatedBy and
// the opaque metadata blob are omitted).
export class EmployeeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional()
  organizationUnitId?: string | null;

  @ApiPropertyOptional()
  userId?: string | null;

  @ApiPropertyOptional()
  managerId?: string | null;

  @ApiProperty()
  employeeNumber!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional()
  dateOfBirth?: string | null;

  @ApiPropertyOptional()
  gender?: string | null;

  @ApiPropertyOptional()
  nationality?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  personalEmail?: string | null;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty({ enum: Object.values(EmploymentType) })
  employmentType!: EmploymentType;

  @ApiProperty({ enum: Object.values(EmploymentStatus) })
  employmentStatus!: EmploymentStatus;

  @ApiProperty()
  hireDate!: string;

  @ApiPropertyOptional()
  terminationDate?: string | null;

  @ApiPropertyOptional()
  baseSalary?: string | null;

  @ApiPropertyOptional()
  payFrequency?: string | null;

  @ApiPropertyOptional()
  currency?: string | null;

  @ApiProperty()
  countryCode!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
