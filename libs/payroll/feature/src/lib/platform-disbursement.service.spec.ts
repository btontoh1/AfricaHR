import { DisbursementNeedingAttention, PayrollDisbursementRepository } from '@africahr/payroll-data-access';
import { PlatformDisbursementService } from './platform-disbursement.service';

describe('PlatformDisbursementService', () => {
  let service: PlatformDisbursementService;
  let disbursements: jest.Mocked<PayrollDisbursementRepository>;

  function makeRow(overrides: Partial<DisbursementNeedingAttention> = {}): DisbursementNeedingAttention {
    return {
      id: 'payslip-1',
      tenantId: 'tenant-1',
      tenantName: 'Acme Ghana Ltd',
      employeeId: 'employee-1',
      employeeFirstName: 'Ama',
      employeeLastName: 'Owusu',
      payRunId: 'pay-run-1',
      periodStart: new Date('2026-07-01'),
      periodEnd: new Date('2026-07-31'),
      currency: 'GHS',
      netPay: 4500,
      disbursementStatus: 'PENDING',
      paystackTransferReference: 'ref-123',
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    disbursements = {
      listDisbursementsNeedingAttention: jest.fn(),
    } as unknown as jest.Mocked<PayrollDisbursementRepository>;
    service = new PlatformDisbursementService(disbursements);
  });

  it('classifies a FAILED row as FAILED severity regardless of age', async () => {
    disbursements.listDisbursementsNeedingAttention.mockResolvedValue([
      makeRow({ disbursementStatus: 'FAILED', updatedAt: new Date() }),
    ]);

    const summary = await service.listNeedingAttention();

    expect(summary.items).toEqual([expect.objectContaining({ severity: 'FAILED' })]);
    expect(summary.counts).toEqual({ stale: 0, critical: 0, failed: 1 });
  });

  it('classifies a PENDING row older than the critical threshold as CRITICAL', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    disbursements.listDisbursementsNeedingAttention.mockResolvedValue([
      makeRow({ disbursementStatus: 'PENDING', updatedAt: twoDaysAgo }),
    ]);

    const summary = await service.listNeedingAttention();

    expect(summary.items).toEqual([expect.objectContaining({ severity: 'CRITICAL' })]);
    expect(summary.counts).toEqual({ stale: 0, critical: 1, failed: 0 });
  });

  it('classifies a PENDING row past the stale threshold but under the critical one as STALE', async () => {
    const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000);
    disbursements.listDisbursementsNeedingAttention.mockResolvedValue([
      makeRow({ disbursementStatus: 'PENDING', updatedAt: fortyFiveMinutesAgo }),
    ]);

    const summary = await service.listNeedingAttention();

    expect(summary.items).toEqual([expect.objectContaining({ severity: 'STALE' })]);
    expect(summary.counts).toEqual({ stale: 1, critical: 0, failed: 0 });
  });

  it('tallies counts across a mix of severities', async () => {
    disbursements.listDisbursementsNeedingAttention.mockResolvedValue([
      makeRow({ id: 'p1', disbursementStatus: 'FAILED' }),
      makeRow({ id: 'p2', disbursementStatus: 'PENDING', updatedAt: new Date(Date.now() - 45 * 60 * 1000) }),
      makeRow({
        id: 'p3',
        disbursementStatus: 'PENDING',
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }),
    ]);

    const summary = await service.listNeedingAttention();

    expect(summary.counts).toEqual({ stale: 1, critical: 1, failed: 1 });
  });

  it('passes a stale-pending-before cutoff derived from the reconciliation sweep threshold', async () => {
    disbursements.listDisbursementsNeedingAttention.mockResolvedValue([]);

    const before = Date.now();
    await service.listNeedingAttention();
    const after = Date.now();

    const cutoff = disbursements.listDisbursementsNeedingAttention.mock.calls[0][0] as Date;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before - 30 * 60 * 1000 - 1000);
    expect(cutoff.getTime()).toBeLessThanOrEqual(after - 30 * 60 * 1000 + 1000);
  });
});
