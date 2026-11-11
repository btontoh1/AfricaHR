import { ApiProperty } from '@nestjs/swagger';

/** Deliberately omits everything but what a kiosk's name picker needs — no pay, contact, or other employee data is ever exposed to the shared device. */
export class KioskEmployeeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() employeeNumber!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
}
