import { ApiProperty } from '@nestjs/swagger';

export class ProcurementSpendByVendorMonthDto {
  @ApiProperty() vendorId!: string;
  @ApiProperty() vendorName!: string;
  @ApiProperty({ description: 'Calendar month the order was placed in, as YYYY-MM' })
  month!: string;
  @ApiProperty() totalSpend!: number;
  @ApiProperty() orderCount!: number;
}
