import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length, Min } from 'class-validator';

export class RequestWalletTopUpDto {
  @ApiProperty({ example: 'GHS', description: "Must match the tenant's own operating currency" })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ example: 5000, description: 'Major currency units (e.g. GHS, not pesewas)' })
  @IsNumber()
  @Min(1)
  amount!: number;
}
