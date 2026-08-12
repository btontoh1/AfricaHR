import { ApiProperty } from '@nestjs/swagger';

/** Deliberately minimal ack for the public submit endpoint. */
export class DemoRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: Date;
}
