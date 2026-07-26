import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PayRun, PayslipLineItem, Prisma } from '@prisma/client';
import { PayslipWithLineItems } from '@africahr/payroll-data-access';
import { AuditService } from '@africahr/platform-audit';
import {
  PayRunRepository,
  PayrollEmployeeRepository,
  PayslipLineItemRepository,
  PayslipRepository,
  StatutoryRateRepository,
  StatutoryTaxBandRepository,
} from '@africahr/payroll-data-access';
import { PayslipService } from './payslip.service';

describe('PayslipService', () => {
  let service: PayslipService;
  let payslips: jest.Mocked<PayslipRepository>;
  let lineItems: jest.Mocked<PayslipLineItemRepository>;
  let payRuns: jest.Mocked<PayRunRepository>;
  let employees: jest.Mocked<PayrollEmployeeRepository>;
  let taxBands: jest.Mocked<StatutoryTaxBandRepository>;
  let rates: jest.Mocked<StatutoryRateRepository>;
  let audit: jest.Mocked<AuditService>;

  function makePayslip(overrides: Partial<PayslipWithLineItems> = {}): PayslipWithLineItems {
    return {
      id: 'payslip-1',
      tenantId: 'tenant-1',
      payRunId: 'run-1',
      employeeId: 'emp-1',
      status: 'DRAFT',
      countryCode: 'GH',
      basicSalary: new Prisma.Decimal(1000),
      grossPay: new Prisma.Decimal(1000),
      taxableIncome: new Prisma.Decimal(945),
      payeTax: new Prisma.Decimal(89),
      ssnitEmployee: new Prisma.Decimal(55),
      ssnitEmployer: new Prisma.Decimal(130),
      totalDeductions: new Prisma.Decimal(144),
      netPay: new Prisma.Decimal(856),
      currency: 'GHS',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      lineItems: [],
      ...overrides,
    } as PayslipWithLineItems;
  }

  function makePayRun(overrides: Partial<PayRun> = {}): PayRun {
    return {
      id: 'run-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
      payDate: new Date('2026-02-01'),
      status: 'PROCESSING',
      approvedAt: null,
      approvedBy: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as PayRun;
  }

  beforeEach(() => {
    payslips = {
      findById: jest.fn(),
      listByPayRun: jest.fn(),
      listByEmployee: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<PayslipRepository>;

    lineItems = {
      create: jest.fn(),
      findById: jest.fn(),
      listByPayslip: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PayslipLineItemRepository>;

    payRuns = { findById: jest.fn() } as unknown as jest.Mocked<PayRunRepository>;

    employees = {
      listActiveByOrganization: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: 'emp-1',
        baseSalary: new Prisma.Decimal(1000),
        currency: 'GHS',
        countryCode: 'GH',
      }),
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<PayrollEmployeeRepository>;

    taxBands = {
      findEffective: jest.fn().mockResolvedValue([{ order: 1, lowerBound: 0, upperBound: null, rate: 0.1 }]),
    } as unknown as jest.Mocked<StatutoryTaxBandRepository>;

    rates = {
      findEffective: jest.fn().mockResolvedValue({ rate: 0.055 }),
    } as unknown as jest.Mocked<StatutoryRateRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new PayslipService(payslips, lineItems, payRuns, employees, taxBands, rates, audit);
  });

  describe('findById', () => {
    it('throws NotFoundException when the payslip does not exist', async () => {
      payslips.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveOwnEmployeeId', () => {
    it('throws ForbiddenException when the user has no linked employee', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.resolveOwnEmployeeId('tenant-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('listForSelf', () => {
    it('resolves the caller\'s own employeeId and lists their payslips', async () => {
      const payslip = makePayslip();
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1' });
      payslips.listByEmployee.mockResolvedValue([payslip]);

      const result = await service.listForSelf('tenant-1', 'user-1');

      expect(employees.findByUserId).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(payslips.listByEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1');
      expect(result).toEqual([payslip]);
    });
  });

  describe('findByIdForSelf', () => {
    it('returns the payslip when it belongs to the caller', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1' });
      payslips.findById.mockResolvedValue(makePayslip({ employeeId: 'emp-1' }));

      const result = await service.findByIdForSelf('tenant-1', 'user-1', 'payslip-1');

      expect(result.employeeId).toBe('emp-1');
    });

    it('throws NotFoundException (not Forbidden) when the payslip belongs to someone else', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1' });
      payslips.findById.mockResolvedValue(makePayslip({ employeeId: 'someone-else' }));

      await expect(
        service.findByIdForSelf('tenant-1', 'user-1', 'payslip-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addLineItem', () => {
    it('rejects adding a line item once the pay run is locked (APPROVED)', async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));

      await expect(
        service.addLineItem('tenant-1', 'payslip-1', {
          type: 'EARNING',
          code: 'OVERTIME',
          amount: 150,
        }),
      ).rejects.toThrow(ConflictException);
      expect(lineItems.create).not.toHaveBeenCalled();
    });

    it('creates the line item, recomputes the payslip, and audits', async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      lineItems.create.mockResolvedValue({ id: 'li-1' } as PayslipLineItem);
      lineItems.listByPayslip.mockResolvedValue([
        { type: 'EARNING', amount: new Prisma.Decimal(150) } as PayslipLineItem,
      ]);

      await service.addLineItem(
        'tenant-1',
        'payslip-1',
        { type: 'EARNING', code: 'OVERTIME', amount: 150 },
        'mgr-1',
      );

      expect(lineItems.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ payslipId: 'payslip-1', type: 'EARNING', code: 'OVERTIME', amount: 150 }),
      );
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ payRunId: 'run-1', employeeId: 'emp-1', grossPay: 1150 }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'payroll.payslip.line_item_added' }),
      );
    });
  });

  describe('removeLineItem', () => {
    it('throws NotFoundException when the line item does not belong to the payslip', async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      lineItems.findById.mockResolvedValue({ id: 'li-1', payslipId: 'other-payslip' } as PayslipLineItem);

      await expect(
        service.removeLineItem('tenant-1', 'payslip-1', 'li-1'),
      ).rejects.toThrow(NotFoundException);
      expect(lineItems.delete).not.toHaveBeenCalled();
    });

    it('deletes the line item and recomputes the payslip', async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      lineItems.findById.mockResolvedValue({ id: 'li-1', payslipId: 'payslip-1' } as PayslipLineItem);

      await service.removeLineItem('tenant-1', 'payslip-1', 'li-1', 'mgr-1');

      expect(lineItems.delete).toHaveBeenCalledWith('tenant-1', 'li-1');
      expect(payslips.upsert).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'payroll.payslip.line_item_removed' }),
      );
    });
  });
});
