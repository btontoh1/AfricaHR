import { PrismaService } from '@africahr/platform-database';
import { PayslipLineItemRepository } from './payslip-line-item.repository';

describe('PayslipLineItemRepository', () => {
  let repository: PayslipLineItemRepository;
  let tx: { payslipLineItem: { create: jest.Mock; findMany: jest.Mock; delete: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { payslipLineItem: { create: jest.fn(), findMany: jest.fn(), delete: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayslipLineItemRepository(prisma as unknown as PrismaService);
  });

  it('creates a line item within the tenant context', async () => {
    await repository.create('tenant-1', {
      payslipId: 'payslip-1',
      type: 'EARNING',
      code: 'OVERTIME',
      amount: 150,
      createdBy: 'mgr-1',
    });

    expect(tx.payslipLineItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        payslipId: 'payslip-1',
        type: 'EARNING',
        code: 'OVERTIME',
        amount: 150,
      }),
    });
  });

  it('lists line items for a payslip in creation order', async () => {
    await repository.listByPayslip('tenant-1', 'payslip-1');

    expect(tx.payslipLineItem.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', payslipId: 'payslip-1' },
      orderBy: { createdAt: 'asc' },
    });
  });
});
