import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletTopUpStatus } from '@prisma/client';

export class WalletTopUpResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() amount!: number;
  @ApiProperty({ enum: Object.values(WalletTopUpStatus) }) status!: WalletTopUpStatus;
  @ApiPropertyOptional({ nullable: true }) checkoutUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) paidAt?: Date | null;
  @ApiProperty() createdAt!: Date;
}
