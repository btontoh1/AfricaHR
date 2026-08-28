import { ApiProperty } from '@nestjs/swagger';

export class BulkImportRowErrorDto {
  @ApiProperty({ description: '1-indexed row number as it would appear in a spreadsheet (header is row 1)' })
  row!: number;

  @ApiProperty()
  message!: string;
}

export class BulkImportResultDto {
  @ApiProperty({ description: 'Number of employees successfully created' })
  created!: number;

  @ApiProperty({ type: [BulkImportRowErrorDto] })
  errors!: BulkImportRowErrorDto[];
}
