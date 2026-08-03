import { randomBytes } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { Employee, EmployeePaymentMethod } from '@prisma/client';
import { AppConfigService, decryptAesGcm, deriveEncryptionKey, encryptAesGcm } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import { EmployeeRepository, PaymentMethodRepository } from '@africahr/employee-data-access';
import { PaymentMethodService } from './payment-method.service';

const validEncryptionKey = randomBytes(32).toString('hex');
const key = deriveEncryptionKey(validEncryptionKey, 'PAYMENT_METHOD_ENCRYPTION_KEY');

function encrypt(plaintext: string): string {
  return encryptAesGcm(plaintext, key);
}

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let paymentMethods: jest.Mocked<PaymentMethodRepository>;
  let employees: jest.Mocked<EmployeeRepository>;
  let audit: jest.Mocked<AuditService>;
  let config: AppConfigService;

  function makePaymentMethod(overrides: Partial<EmployeePaymentMethod> = {}): EmployeePaymentMethod {
    return {
      id: 'pm-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      type: 'BANK_ACCOUNT',
      bankName: encrypt('GCB Bank'),
      bankCode: encrypt('040'),
      accountNumber: encrypt('1234567890'),
      accountName: encrypt('Frimpong Tontoh'),
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
    config = { paymentMethodEncryptionKey: validEncryptionKey } as unknown as AppConfigService;

    service = new PaymentMethodService(paymentMethods, employees, audit, config);
  });

  it('fails to construct when PAYMENT_METHOD_ENCRYPTION_KEY is unset', () => {
    const badConfig = { paymentMethodEncryptionKey: undefined } as unknown as AppConfigService;

    expect(() => new PaymentMethodService(paymentMethods, employees, audit, badConfig)).toThrow(
      /PAYMENT_METHOD_ENCRYPTION_KEY must be set/,
    );
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
    it('resolves the caller\'s own employeeId and returns the decrypted payment method', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.findByEmployeeId.mockResolvedValue(makePaymentMethod());

      const result = await service.getForSelf('tenant-1', 'user-1');

      expect(employees.findByUserId).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(paymentMethods.findByEmployeeId).toHaveBeenCalledWith('tenant-1', 'emp-1');
      expect(result?.id).toBe('pm-1');
      expect(result?.bankName).toBe('GCB Bank');
      expect(result?.bankCode).toBe('040');
      expect(result?.accountNumber).toBe('1234567890');
      expect(result?.accountName).toBe('Frimpong Tontoh');
    });

    it('returns null when the employee has no payment method on file yet', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.findByEmployeeId.mockResolvedValue(null);

      const result = await service.getForSelf('tenant-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('upsertForSelf', () => {
    it('encrypts fields before storing them, rather than persisting plaintext', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.upsert.mockResolvedValue(makePaymentMethod());

      await service.upsertForSelf('tenant-1', 'user-1', {
        type: 'BANK_ACCOUNT',
        bankName: 'GCB Bank',
        bankCode: '040',
        accountNumber: '1234567890',
        accountName: 'Frimpong Tontoh',
      } as never);

      const [, , storedInput] = paymentMethods.upsert.mock.calls[0];
      expect(storedInput.bankName).not.toBe('GCB Bank');
      expect(storedInput.accountNumber).not.toBe('1234567890');
      expect(decryptAesGcm(storedInput.bankName as string, key)).toBe('GCB Bank');
      expect(decryptAesGcm(storedInput.accountNumber as string, key)).toBe('1234567890');
    });

    it('returns the decrypted payment method, not the ciphertext that was stored', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.upsert.mockResolvedValue(makePaymentMethod());

      const result = await service.upsertForSelf('tenant-1', 'user-1', {
        type: 'BANK_ACCOUNT',
        bankName: 'GCB Bank',
        bankCode: '040',
        accountNumber: '1234567890',
        accountName: 'Frimpong Tontoh',
      } as never);

      expect(result.bankName).toBe('GCB Bank');
      expect(result.accountNumber).toBe('1234567890');
    });

    it('clears the other type\'s fields when switching from bank account to mobile money', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.upsert.mockResolvedValue(
        makePaymentMethod({
          type: 'MOBILE_MONEY',
          bankName: null,
          bankCode: null,
          accountNumber: null,
          accountName: null,
          mobileMoneyProvider: encrypt('MTN Mobile Money'),
          mobileMoneyNumber: encrypt('0244000000'),
        }),
      );

      const result = await service.upsertForSelf('tenant-1', 'user-1', {
        type: 'MOBILE_MONEY',
        mobileMoneyProvider: 'MTN Mobile Money',
        mobileMoneyNumber: '0244000000',
      } as never);

      expect(paymentMethods.upsert).toHaveBeenCalledWith(
        'tenant-1',
        'emp-1',
        expect.objectContaining({
          type: 'MOBILE_MONEY',
          bankName: null,
          bankCode: null,
          accountNumber: null,
          accountName: null,
          actorId: 'user-1',
        }),
      );
      const [, , storedInput] = paymentMethods.upsert.mock.calls[0];
      expect(storedInput.mobileMoneyProvider).not.toBe('MTN Mobile Money');
      expect(decryptAesGcm(storedInput.mobileMoneyProvider as string, key)).toBe('MTN Mobile Money');
      expect(result.mobileMoneyProvider).toBe('MTN Mobile Money');
      expect(result.mobileMoneyNumber).toBe('0244000000');
    });

    it('audits the update', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1' } as Employee);
      paymentMethods.upsert.mockResolvedValue(makePaymentMethod());

      await service.upsertForSelf('tenant-1', 'user-1', {
        type: 'BANK_ACCOUNT',
        bankName: 'GCB Bank',
        bankCode: '040',
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
