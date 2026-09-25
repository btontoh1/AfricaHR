import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

export class SetHomeCurrencyDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ example: 'GHS', description: 'The currency every FX revaluation for this organization converts foreign balances into' })
  @IsString()
  @Length(3, 3)
  currency!: string;
}
