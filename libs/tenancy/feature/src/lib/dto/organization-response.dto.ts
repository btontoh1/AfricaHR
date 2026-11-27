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

  @ApiProperty({ description: "URL-friendly identifier used in this organization's own sign-in link" })
  slug!: string;

  @ApiProperty()
  countryCode!: string;

  @ApiProperty()
  registrationNumber!: string;

  @ApiPropertyOptional()
  taxIdentificationNumber?: string | null;

  @ApiPropertyOptional({ description: "Shown as the employer's address on payslips" })
  address?: string | null;

  @ApiProperty({ enum: OrganizationVerificationStatus })
  verificationStatus!: OrganizationVerificationStatus;

  @ApiPropertyOptional({ description: 'Reviewer note, set on rejection' })
  verificationNote?: string | null;

  @ApiPropertyOptional()
  verifiedAt?: string | null;

  @ApiPropertyOptional({ description: "Storage key for the organization's own logo, shown on its invoices" })
  logoStorageKey?: string | null;

  @ApiPropertyOptional({
    description:
      'Storage key for a second logo shown on the opposite side of the invoice header (e.g. an IATA/accreditation mark)',
  })
  secondaryLogoStorageKey?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
