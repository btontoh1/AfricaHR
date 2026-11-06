import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty() balance!: number;
}
