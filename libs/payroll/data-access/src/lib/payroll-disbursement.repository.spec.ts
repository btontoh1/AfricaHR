import { PrismaService } from '@africahr/platform-database';
import { PayrollDisbursementRepository } from './payroll-disbursement.repository';

describe('PayrollDisbursementRepository', () => {
  let repository: PayrollDisbursementRepository;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    repository = new PayrollDisbursementRepository(prisma as unknown as PrismaService);
  });

  it('finds a payslip by paystack transfer reference across tenants', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { id: 'payslip-1', tenantId: 'tenant-1', disbursementStatus: 'PENDING' },
    ]);

    const result = await repository.findPayslipByPaystackTransferReference('ref-123');

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual({ id: 'payslip-1', tenantId: 'tenant-1', disbursementStatus: 'PENDING' });
  });

  it('returns null when no payslip matches the reference', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await expect(repository.findPayslipByPaystackTransferReference('missing')).resolves.toBeNull();
  });

  it('lists stale pending disbursements across tenants', async () => {
    const olderThan = new Date('2026-01-01');
    prisma.$queryRaw.mockResolvedValue([
      { id: 'payslip-1', tenantId: 'tenant-1', paystackTransferReference: 'ref-123' },
    ]);

    const result = await repository.listStalePendingDisbursements(olderThan);

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'payslip-1', tenantId: 'tenant-1', paystackTransferReference: 'ref-123' }]);
  });

  it('lists disbursements needing attention across tenants, parsing netPay to a number', async () => {
    const stalePendingBefore = new Date('2026-01-01');
    prisma.$queryRaw.mockResolvedValue([
      {
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
        netPay: '4500.50',
        disbursementStatus: 'FAILED',
        paystackTransferReference: 'ref-123',
        updatedAt: new Date('2026-08-01'),
      },
    ]);

    const result = await repository.listDisbursementsNeedingAttention(stalePendingBefore);

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({ id: 'payslip-1', netPay: 4500.5, disbursementStatus: 'FAILED' }),
    ]);
  });

  it('returns an empty list when nothing needs attention', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await expect(repository.listDisbursementsNeedingAttention(new Date())).resolves.toEqual([]);
  });
});
