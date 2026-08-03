import { ApiProperty } from '@nestjs/swagger';

export class BankOptionResponseDto {
  @ApiProperty({ example: 'GCB Bank' })
  name!: string;

  @ApiProperty({ example: '040' })
  code!: string;
}
