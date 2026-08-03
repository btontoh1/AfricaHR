import { PrismaService } from '@africahr/platform-database';
import { PaymentMethodRepository } from './payment-method.repository';

describe('PaymentMethodRepository', () => {
  let repository: PaymentMethodRepository;
  let tx: { employeePaymentMethod: { findFirst: jest.Mock; upsert: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      employeePaymentMethod: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PaymentMethodRepository(prisma as unknown as PrismaService);
  });

  it('finds a payment method by employeeId, scoped to the tenant', async () => {
    await repository.findByEmployeeId('tenant-1', 'emp-1');

    expect(tx.employeePaymentMethod.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'emp-1' },
    });
  });

  it('upserts a bank account payment method, including the Paystack bank code', async () => {
    await repository.upsert('tenant-1', 'emp-1', {
      type: 'BANK_ACCOUNT',
      bankName: 'GCB Bank',
      bankCode: '040',
      accountNumber: '1234567890',
      accountName: 'Frimpong Tontoh',
      actorId: 'user-1',
    });

    expect(tx.employeePaymentMethod.upsert).toHaveBeenCalledWith({
      where: { employeeId: 'emp-1' },
      create: expect.objectContaining({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        type: 'BANK_ACCOUNT',
        bankName: 'GCB Bank',
        bankCode: '040',
        accountNumber: '1234567890',
        accountName: 'Frimpong Tontoh',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      }),
      update: expect.objectContaining({
        type: 'BANK_ACCOUNT',
        bankName: 'GCB Bank',
        bankCode: '040',
        accountNumber: '1234567890',
        accountName: 'Frimpong Tontoh',
        updatedBy: 'user-1',
      }),
    });
  });
});
