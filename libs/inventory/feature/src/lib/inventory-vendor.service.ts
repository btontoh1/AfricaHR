import { Injectable } from '@nestjs/common';
import { InventoryVendorRepository, InventoryVendorSummary } from '@africahr/inventory-data-access';

@Injectable()
export class InventoryVendorService {
  constructor(private readonly vendors: InventoryVendorRepository) {}

  list(tenantId: string, organizationId?: string): Promise<InventoryVendorSummary[]> {
    return this.vendors.list(tenantId, organizationId);
  }
}
