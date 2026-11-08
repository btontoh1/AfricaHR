import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

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
}
