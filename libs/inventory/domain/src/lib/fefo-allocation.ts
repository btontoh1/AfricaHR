export interface BatchAvailability {
  batchId: string;
  expiryDate: Date;
  remainingQuantity: number;
}

export interface BatchAllocation {
  batchId: string;
  quantity: number;
}

/**
 * Thrown by allocateFefo when the non-expired batches on hand can't cover
 * the requested quantity - mirrors InsufficientStockError's shape
 * (available/requested) so callers can report it the same way, but at
 * batch-pool granularity rather than the aggregate warehouse balance.
 */
export class InsufficientBatchStockError extends Error {
  constructor(
    public readonly available: number,
    public readonly requested: number,
  ) {
    super('Insufficient non-expired batch stock to complete this transaction');
  }
}

/**
 * First-Expired-First-Out allocation: given the batches on hand for one
 * product/warehouse, decides which batches (and how much of each) to draw
 * `quantityNeeded` from. Batches already expired as of `asOf` are excluded
 * entirely from the allocatable pool - a pharmacy can't dispense expired
 * stock by drawing on it as a last resort, so "insufficient" is the correct
 * outcome rather than silently reaching past expiry. Batches with zero
 * remaining quantity are skipped. Ties on expiry date fall back to
 * insertion order (stable sort), since `batches` is expected to already be
 * the DB's own expiry-then-creation ordering.
 *
 * Pure and side-effect free: it only decides the allocation plan. The
 * caller is responsible for applying it (decrementing each batch's
 * remainingQuantity, posting one ledger leg per batch) inside a
 * transaction.
 */
export function allocateFefo(
  batches: BatchAvailability[],
  quantityNeeded: number,
  asOf: Date,
): BatchAllocation[] {
  if (quantityNeeded <= 0) {
    return [];
  }

  const eligible = batches
    .filter((batch) => batch.remainingQuantity > 0 && batch.expiryDate >= asOf)
    .slice()
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

  const allocations: BatchAllocation[] = [];
  let remaining = quantityNeeded;

  for (const batch of eligible) {
    if (remaining <= 0) {
      break;
    }
    const take = Math.min(batch.remainingQuantity, remaining);
    allocations.push({ batchId: batch.batchId, quantity: take });
    remaining -= take;
  }

  if (remaining > 0) {
    const available = eligible.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
    throw new InsufficientBatchStockError(available, quantityNeeded);
  }

  return allocations;
}

export type BatchExpiryStatus = 'OK' | 'EXPIRING_SOON' | 'EXPIRED';

/**
 * Classifies a batch's expiry for display (badges on the Batches list) -
 * EXPIRED once past `asOf` (the same cutoff allocateFefo uses, so a batch
 * never shows as allocatable while also showing OK), EXPIRING_SOON inside
 * `warningWindowDays` of that cutoff, otherwise OK.
 */
export function getBatchExpiryStatus(
  expiryDate: Date,
  asOf: Date,
  warningWindowDays = 30,
): BatchExpiryStatus {
  if (expiryDate < asOf) {
    return 'EXPIRED';
  }
  const warningThreshold = new Date(asOf.getTime() + warningWindowDays * 24 * 60 * 60 * 1000);
  if (expiryDate <= warningThreshold) {
    return 'EXPIRING_SOON';
  }
  return 'OK';
}
