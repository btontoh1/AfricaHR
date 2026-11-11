import { ApiProperty } from '@nestjs/swagger';

export class KioskClockResponseDto {
  @ApiProperty({ enum: ['CLOCKED_IN', 'CLOCKED_OUT'] })
  action!: 'CLOCKED_IN' | 'CLOCKED_OUT';

  @ApiProperty()
  employeeName!: string;

  @ApiProperty()
  at!: Date;
}
