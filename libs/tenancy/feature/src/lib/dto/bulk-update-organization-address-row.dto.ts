import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

// Not a Swagger-documented request body - only used internally by
// OrganizationBulkImportService to validate each parsed CSV row before
// forwarding it to OrganizationService.update.
export class BulkUpdateOrganizationAddressRowDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  address?: string;
}
