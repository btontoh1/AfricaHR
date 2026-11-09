export interface StockMovement {
  quantityIn: number;
  quantityOut: number;
}

/**
 * Net quantity change a ledger entry applies to a balance - the one place
 * this sign convention is defined, so every caller (balance updates,
 * dashboard totals) computes it identically.
 */
export function netQuantity(movement: StockMovement): number {
  return movement.quantityIn - movement.quantityOut;
}

/**
 * True if issuing `quantityToIssue` from a warehouse currently holding
 * `currentBalance` would take it negative. InventoryStockService rejects
 * any Goods Issue / Transfer-Out / Adjustment-Out this returns true for -
 * negative inventory is never allowed by default, since stock can't be
 * issued that was never received.
 */
export function wouldGoNegative(currentBalance: number, quantityToIssue: number): boolean {
  return currentBalance - quantityToIssue < 0;
}

export interface StockLedgerEntryLike {
  warehouseId: string;
  productId: string;
  quantityIn: number;
  quantityOut: number;
  unitCost: number | null;
}

/**
 * Builds the reversal ledger entry for correcting a posted entry -
 * quantityIn/quantityOut swapped, same warehouse/product/cost, with the
 * caller expected to set reversalOfId to the original entry's id. This is
 * the only sanctioned way to correct a posted stock transaction; posted
 * entries are never edited or deleted (see InventoryStockLedgerEntry).
 */
export function buildReversalEntry(original: StockLedgerEntryLike): StockLedgerEntryLike {
  return {
    warehouseId: original.warehouseId,
    productId: original.productId,
    quantityIn: original.quantityOut,
    quantityOut: original.quantityIn,
    unitCost: original.unitCost,
  };
}
