import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';
import { BulkImportDefaultsDto } from './bulk-import-defaults.dto';

// The CSV covers only the core employee-record fields (see
// BulkImportRowDto) - organizationUnitId, managerId, and familyMembers are
// deliberately left out of v1 (they'd require either raw UUIDs a
// non-technical HR user migrating from another system won't have, or a
// second linking pass across rows). Those stay manual edits after import.
export class BulkImportEmployeesDto {
  @ApiProperty({ description: 'Every row in the CSV is created under this organization' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ description: 'Raw CSV content, including the header row' })
  @IsString()
  @MinLength(1)
  csv!: string;

  @ApiPropertyOptional({
    description:
      "Fallback values for any row that leaves its jobTitle/employmentType/hireDate/countryCode column blank - see BulkImportDefaultsDto. Lets a names-only CSV (just firstName,lastName) import successfully.",
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BulkImportDefaultsDto)
  defaults?: BulkImportDefaultsDto;
}
