import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { VendorRepository } from './vendor.repository';
import { VendorBillRepository } from './vendor-bill.repository';
import { VendorPaymentRepository } from './vendor-payment.repository';

@Module({
  imports: [PrismaModule],
  providers: [VendorRepository, VendorBillRepository, VendorPaymentRepository],
  exports: [VendorRepository, VendorBillRepository, VendorPaymentRepository],
})
export class ApDataAccessModule {}
