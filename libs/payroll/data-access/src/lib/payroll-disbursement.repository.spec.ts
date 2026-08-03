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
});
