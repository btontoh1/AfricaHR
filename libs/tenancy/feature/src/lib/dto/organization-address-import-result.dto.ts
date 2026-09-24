import { ApiProperty } from '@nestjs/swagger';

export class OrganizationAddressImportRowErrorDto {
  @ApiProperty({ description: '1-indexed row number as it would appear in a spreadsheet (header is row 1)' })
  row!: number;

  @ApiProperty()
  message!: string;
}

export class OrganizationAddressImportResultDto {
  @ApiProperty({ description: 'Number of organizations whose address was updated' })
  updated!: number;

  @ApiProperty({ type: [OrganizationAddressImportRowErrorDto] })
  errors!: OrganizationAddressImportRowErrorDto[];
}
