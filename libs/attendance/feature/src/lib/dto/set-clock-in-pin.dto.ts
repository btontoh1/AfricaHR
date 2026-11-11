import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class SetClockInPinDto {
  @ApiProperty({ example: '4821', description: '4-6 digit numeric PIN the employee will enter at the kiosk' })
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4 to 6 digits' })
  pin!: string;
}
