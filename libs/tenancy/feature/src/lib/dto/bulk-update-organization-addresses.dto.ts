import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class BulkUpdateOrganizationAddressesDto {
  @ApiProperty({ description: 'Raw CSV content, including the header row - columns: id, address' })
  @IsString()
  @MinLength(1)
  csv!: string;
}
