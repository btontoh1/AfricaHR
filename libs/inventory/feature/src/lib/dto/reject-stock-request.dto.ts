import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RejectStockRequestDto {
  @ApiProperty({ example: 'Out of budget for this item' })
  @IsString()
  @Length(1, 500)
  reviewNote!: string;
}
