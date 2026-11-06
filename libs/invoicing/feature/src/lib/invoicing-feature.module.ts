import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { StorageModule } from '@africahr/platform-storage';
import { InvoicingDataAccessModule } from '@africahr/invoicing-data-access';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { CustomerInvoiceService } from './customer-invoice.service';
import { CustomerInvoiceController } from './customer-invoice.controller';
import { InvoicePdfService } from './invoice-pdf.service';

@Module({
  imports: [InvoicingDataAccessModule, PlatformAuthModule, AuditModule, StorageModule],
  controllers: [CustomerController, CustomerInvoiceController],
  providers: [CustomerService, CustomerInvoiceService, InvoicePdfService],
  exports: [CustomerService, CustomerInvoiceService],
})
export class InvoicingFeatureModule {}
