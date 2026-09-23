import { ApiProperty } from '@nestjs/swagger';

export class GlAccountResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;
}
