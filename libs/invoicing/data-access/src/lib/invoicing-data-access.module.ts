import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { CustomerRepository } from './customer.repository';
import { CustomerInvoiceRepository } from './customer-invoice.repository';

@Module({
  imports: [PrismaModule],
  providers: [CustomerRepository, CustomerInvoiceRepository],
  exports: [CustomerRepository, CustomerInvoiceRepository],
})
export class InvoicingDataAccessModule {}
