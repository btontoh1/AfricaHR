import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { ApDataAccessModule } from '@africahr/ap-data-access';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { VendorBillService } from './vendor-bill.service';
import { VendorBillController } from './vendor-bill.controller';
import { VendorPaymentService } from './vendor-payment.service';
import { VendorPaymentController } from './vendor-payment.controller';

@Module({
  imports: [ApDataAccessModule, PlatformAuthModule, AuditModule],
  controllers: [VendorController, VendorBillController, VendorPaymentController],
  providers: [VendorService, VendorBillService, VendorPaymentService],
  exports: [VendorService, VendorBillService, VendorPaymentService],
})
export class ApFeatureModule {}
