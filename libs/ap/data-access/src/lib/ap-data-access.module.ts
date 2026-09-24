import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { VendorRepository } from './vendor.repository';
import { VendorBillRepository } from './vendor-bill.repository';

@Module({
  imports: [PrismaModule],
  providers: [VendorRepository, VendorBillRepository],
  exports: [VendorRepository, VendorBillRepository],
})
export class ApDataAccessModule {}
