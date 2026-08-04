import { PrismaService } from '@africahr/platform-database';
import { PayslipRepository } from './payslip.repository';

describe('PayslipRepository', () => {
  let repository: PayslipRepository;
  let tx: { payslip: { upsert: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      payslip: { upsert: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayslipRepository(prisma as unknown as PrismaService);
  });

  it('upserts on the (payRunId, employeeId) unique key', async () => {
    await repository.upsert('tenant-1', {
      payRunId: 'run-1',
      employeeId: 'emp-1',
      countryCode: 'GH',
      basicSalary: 1000,
      grossPay: 1000,
      taxableIncome: 945,
      payeTax: 89,
      ssnitEmployee: 55,
      ssnitEmployer: 130,
      ghanaTier2PensionEmployer: 50,
      kenyaShifEmployee: 0,
      kenyaHousingLevyEmployee: 0,
      kenyaHousingLevyEmployer: 0,
      nigeriaNsitfEmployer: 0,
      nigeriaNhisEmployee: 0,
      nigeriaNhisEmployer: 0,
      totalDeductions: 144,
      netPay: 856,
      currency: 'GHS',
      actorId: 'mgr-1',
    });

    expect(tx.payslip.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { payRunId_employeeId: { payRunId: 'run-1', employeeId: 'emp-1' } },
        create: expect.objectContaining({ tenantId: 'tenant-1', netPay: 856 }),
        update: expect.objectContaining({ netPay: 856 }),
      }),
    );
  });

  it('lists payslips for a pay run with their line items included', async () => {
    await repository.listByPayRun('tenant-1', 'run-1');

    expect(tx.payslip.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', payRunId: 'run-1', deletedAt: null },
      include: { lineItems: true },
      orderBy: { createdAt: 'asc' },
    });
  });

  describe('recordDisbursementInitiated', () => {
    it('marks the payslip PENDING and stores the Paystack references', async () => {
      await repository.recordDisbursementInitiated('tenant-1', 'payslip-1', {
        paystackRecipientCode: 'RCP_abc',
        paystackTransferReference: 'ref-123',
      });

      expect(tx.payslip.update).toHaveBeenCalledWith({
        where: { id: 'payslip-1' },
        data: {
          disbursementStatus: 'PENDING',
          paystackRecipientCode: 'RCP_abc',
          paystackTransferReference: 'ref-123',
        },
      });
    });
  });

  describe('recordDisbursementResult', () => {
    it('records a successful transfer with a disbursedAt timestamp', async () => {
      await repository.recordDisbursementResult('tenant-1', 'payslip-1', 'SUCCESS');

      expect(tx.payslip.update).toHaveBeenCalledWith({
        where: { id: 'payslip-1' },
        data: { disbursementStatus: 'SUCCESS', disbursedAt: expect.any(Date) },
      });
    });

    it('records a failed transfer', async () => {
      await repository.recordDisbursementResult('tenant-1', 'payslip-1', 'FAILED');

      expect(tx.payslip.update).toHaveBeenCalledWith({
        where: { id: 'payslip-1' },
        data: { disbursementStatus: 'FAILED', disbursedAt: expect.any(Date) },
      });
    });
  });
});
