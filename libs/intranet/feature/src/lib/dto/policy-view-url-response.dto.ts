import { ApiProperty } from '@nestjs/swagger';

export class PolicyViewUrlResponseDto {
  @ApiProperty()
  viewUrl!: string;
}
