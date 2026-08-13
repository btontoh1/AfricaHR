import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationVerificationStatus } from '@africahr/tenancy-domain';

// Documents the response shape for Swagger/OpenAPI-client codegen only —
// OrganizationService returns the Prisma entity directly. Audit fields
// (deletedAt/createdBy/updatedBy) and the opaque metadata blob are
// omitted, same curation approach as EmployeeResponseDto.
export class OrganizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  legalName!: string;

  @ApiPropertyOptional()
  tradingName?: string | null;

  @ApiProperty()
  countryCode!: string;

  @ApiProperty()
  registrationNumber!: string;

  @ApiPropertyOptional()
  taxIdentificationNumber?: string | null;

  @ApiProperty({ enum: OrganizationVerificationStatus })
  verificationStatus!: OrganizationVerificationStatus;

  @ApiPropertyOptional({ description: 'Reviewer note, set on rejection' })
  verificationNote?: string | null;

  @ApiPropertyOptional()
  verifiedAt?: string | null;

  @ApiPropertyOptional({ description: "Storage key for the organization's own logo, shown on its invoices" })
  logoStorageKey?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
