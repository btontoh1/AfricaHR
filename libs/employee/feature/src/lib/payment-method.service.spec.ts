import { ForbiddenException } from '@nestjs/common';
import { Employee, EmployeePaymentMethod } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { EmployeeRepository, PaymentMethodRepository } from '@africahr/employee-data-access';
import { PaymentMethodService } from './payment-method.service';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let paymentMethods: jest.Mocked<PaymentMethodRepository>;
  let employees: jest.Mocked<EmployeeRepository>;
  let audit: jest.Mocked<AuditService>;

  function makePaymentMethod(overrides: Partial<EmployeePaymentMethod> = {}): EmployeePaymentMethod {
    return {
      id: 'pm-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      type: 'BANK_ACCOUNT',
      bankName: 'GCB Bank',
      accountNumber: '1234567890',
      accountName: 'Frimpong Tontoh',
      mobileMoneyProvider: null,
      mobileMoneyNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as EmployeePaymentMethod;
  }

  beforeEach(() => {
    paymentMethods = {
      findByEmployeeId: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<PaymentMethodRepository>;

    employees = {
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<EmployeeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new PaymentMethodService(paymentMethods, employees, audit);
  });

  describe('resolveOwnEmployeeId', () => {
    it('throws ForbiddenException when the user has no linked employee', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.resolveOwnEmployeeId('tenant-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getForSelf', () => {
    it('resolves the caller\'s own employeeId and fetches their payment method', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.findByEmployeeId.mockResolvedValue(makePaymentMethod());

      const result = await service.getForSelf('tenant-1', 'user-1');

      expect(employees.findByUserId).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(paymentMethods.findByEmployeeId).toHaveBeenCalledWith('tenant-1', 'emp-1');
      expect(result?.id).toBe('pm-1');
    });

    it('returns null when the employee has no payment method on file yet', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.findByEmployeeId.mockResolvedValue(null);

      const result = await service.getForSelf('tenant-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('upsertForSelf', () => {
    it('clears the other type\'s fields when switching from bank account to mobile money', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.upsert.mockResolvedValue(
        makePaymentMethod({
          type: 'MOBILE_MONEY',
          bankName: null,
          accountNumber: null,
          accountName: null,
          mobileMoneyProvider: 'MTN Mobile Money',
          mobileMoneyNumber: '0244000000',
        }),
      );

      await service.upsertForSelf('tenant-1', 'user-1', {
        type: 'MOBILE_MONEY',
        mobileMoneyProvider: 'MTN Mobile Money',
        mobileMoneyNumber: '0244000000',
      } as never);

      expect(paymentMethods.upsert).toHaveBeenCalledWith('tenant-1', 'emp-1', {
        type: 'MOBILE_MONEY',
        bankName: null,
        bankCode: null,
        accountNumber: null,
        accountName: null,
        mobileMoneyProvider: 'MTN Mobile Money',
        mobileMoneyNumber: '0244000000',
        actorId: 'user-1',
      });
    });

    it('audits the update', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.upsert.mockResolvedValue(makePaymentMethod());

      await service.upsertForSelf('tenant-1', 'user-1', {
        type: 'BANK_ACCOUNT',
        bankName: 'GCB Bank',
        accountNumber: '1234567890',
        accountName: 'Frimpong Tontoh',
      } as never);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          action: 'employee.payment_method.updated',
          resourceType: 'EmployeePaymentMethod',
          resourceId: 'pm-1',
        }),
      );
    });
  });
});
