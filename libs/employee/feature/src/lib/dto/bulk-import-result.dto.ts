import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkImportRowErrorDto {
  @ApiProperty({ description: '1-indexed row number as it would appear in a spreadsheet (header is row 1)' })
  row!: number;

  @ApiProperty()
  message!: string;
}

export class BulkImportKioskPinDto {
  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  employeeNumber!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ description: 'Plaintext PIN - only ever surfaced here, this one time; only its hash is stored.' })
  pin!: string;
}

export class BulkImportResultDto {
  @ApiProperty({ description: 'Number of employees successfully created' })
  created!: number;

  @ApiProperty({ type: [BulkImportRowErrorDto] })
  errors!: BulkImportRowErrorDto[];

  @ApiPropertyOptional({
    type: [BulkImportKioskPinDto],
    description:
      'Present only when the request set assignKioskPins. One entry per employee created in this batch, with that employee\'s freshly generated plaintext PIN - the only time it is ever returned. Print or hand these out now; they cannot be recovered later, only reset via a new PIN.',
  })
  kioskPins?: BulkImportKioskPinDto[];
}
