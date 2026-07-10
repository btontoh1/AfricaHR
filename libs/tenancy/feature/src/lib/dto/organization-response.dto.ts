import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
