import { ApiProperty } from '@nestjs/swagger';

export class TenantMeResponseDto {
  @ApiProperty({ example: 'Acme Ghana Ltd' })
  name!: string;

  @ApiProperty({ example: 'acme-ghana-ltd' })
  slug!: string;
}
