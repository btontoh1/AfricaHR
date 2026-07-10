import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class RespondToOfferDto {
  @ApiProperty()
  @IsBoolean()
  accepted!: boolean;
}
