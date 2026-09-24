import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { ApDataAccessModule } from '@africahr/ap-data-access';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { VendorBillService } from './vendor-bill.service';
import { VendorBillController } from './vendor-bill.controller';

@Module({
  imports: [ApDataAccessModule, PlatformAuthModule, AuditModule],
  controllers: [VendorController, VendorBillController],
  providers: [VendorService, VendorBillService],
  exports: [VendorService, VendorBillService],
})
export class ApFeatureModule {}
