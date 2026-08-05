import { Injectable } from '@nestjs/common';
import { PayslipDisbursementStatus } from '@prisma/client';
import { DisbursementNeedingAttention, PayrollDisbursementRepository } from '@africahr/payroll-data-access';
import { CRITICAL_STALE_THRESHOLD_MS, STALE_PENDING_THRESHOLD_MS } from './payroll-transfer-webhook.listener';

export type DisbursementSeverity = 'STALE' | 'CRITICAL' | 'FAILED';

export interface DisbursementNeedingAttentionWithSeverity extends DisbursementNeedingAttention {
  severity: DisbursementSeverity;
}

export interface DisbursementAttentionSummary {
  items: DisbursementNeedingAttentionWithSeverity[];
  counts: { stale: number; critical: number; failed: number };
}

function classifySeverity(row: DisbursementNeedingAttention, criticalBeforeMs: number): DisbursementSeverity {
  if (row.disbursementStatus === PayslipDisbursementStatus.FAILED) {
    return 'FAILED';
  }
  return row.updatedAt.getTime() < criticalBeforeMs ? 'CRITICAL' : 'STALE';
}

/**
 * Platform-admin, cross-tenant view of every disbursement needing a
 * human's attention - previously this only reached a *tenant's* HR/
 * payroll admin via a notification event (see
 * PayrollTransferWebhookListener's PAYROLL_DISBURSEMENT_STUCK_EVENT/
 * PAYROLL_DISBURSEMENT_FAILED_EVENT), leaving the platform admin who
 * actually operates the Paystack integration with no visibility at all.
 * Reuses that same listener's stale/critical thresholds so "what counts
 * as stuck" is defined in exactly one place.
 */
@Injectable()
export class PlatformDisbursementService {
  constructor(private readonly disbursements: PayrollDisbursementRepository) {}

  async listNeedingAttention(): Promise<DisbursementAttentionSummary> {
    const now = Date.now();
    const stalePendingBefore = new Date(now - STALE_PENDING_THRESHOLD_MS);
    const criticalBeforeMs = now - CRITICAL_STALE_THRESHOLD_MS;

    const rows = await this.disbursements.listDisbursementsNeedingAttention(stalePendingBefore);

    const items = rows.map((row) => ({ ...row, severity: classifySeverity(row, criticalBeforeMs) }));

    const counts = { stale: 0, critical: 0, failed: 0 };
    for (const item of items) {
      if (item.severity === 'STALE') counts.stale += 1;
      else if (item.severity === 'CRITICAL') counts.critical += 1;
      else counts.failed += 1;
    }

    return { items, counts };
  }
}
