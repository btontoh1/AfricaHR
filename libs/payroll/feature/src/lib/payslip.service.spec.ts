import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PayRun, PayslipLineItem, Prisma } from '@prisma/client';
import { PayslipWithLineItems } from '@africahr/payroll-data-access';
import { AuditService } from '@africahr/platform-audit';
import {
  PayrollBenefitEnrollmentRepository,
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
  let benefitEnrollments: jest.Mocked<PayrollBenefitEnrollmentRepository>;
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

    payRuns = {
      findById: jest.fn(),
      findManyByIds: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<PayRunRepository>;

    employees = {
      listActiveByOrganization: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({
        id: 'emp-1',
        organizationId: 'org-1',
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

    benefitEnrollments = {
      listActiveForEmployee: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<PayrollBenefitEnrollmentRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new PayslipService(
      payslips,
      lineItems,
      payRuns,
      employees,
      taxBands,
      rates,
      benefitEnrollments,
      audit,
    );
  });

  describe('findById', () => {
    it('throws NotFoundException when the payslip does not exist', async () => {
      payslips.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByIdWithPeriod', () => {
    it('merges the pay run\'s period dates onto the payslip', async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun());

      const result = await service.findByIdWithPeriod('tenant-1', 'payslip-1');

      expect(result.periodStart).toEqual(new Date('2026-01-01'));
      expect(result.periodEnd).toEqual(new Date('2026-01-31'));
      expect(result.payDate).toEqual(new Date('2026-02-01'));
    });

    it('throws NotFoundException when the pay run behind the payslip is gone', async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(null);

      await expect(service.findByIdWithPeriod('tenant-1', 'payslip-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listByEmployee', () => {
    it('batches a single pay-run lookup across payslips from different pay runs', async () => {
      const payslipA = makePayslip({ id: 'payslip-a', payRunId: 'run-1' });
      const payslipB = makePayslip({ id: 'payslip-b', payRunId: 'run-2' });
      payslips.listByEmployee.mockResolvedValue([payslipA, payslipB]);
      payRuns.findManyByIds.mockResolvedValue([
        makePayRun({ id: 'run-1' }),
        makePayRun({ id: 'run-2', periodStart: new Date('2026-02-01'), periodEnd: new Date('2026-02-28'), payDate: new Date('2026-03-01') }),
      ]);

      const result = await service.listByEmployee('tenant-1', 'emp-1');

      expect(payRuns.findManyByIds).toHaveBeenCalledWith('tenant-1', ['run-1', 'run-2']);
      expect(result[0].periodStart).toEqual(new Date('2026-01-01'));
      expect(result[1].periodStart).toEqual(new Date('2026-02-01'));
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
      payRuns.findManyByIds.mockResolvedValue([makePayRun()]);

      const result = await service.listForSelf('tenant-1', 'user-1');

      expect(employees.findByUserId).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(payslips.listByEmployee).toHaveBeenCalledWith('tenant-1', 'emp-1');
      expect(result).toEqual([{ ...payslip, periodStart: expect.any(Date), periodEnd: expect.any(Date), payDate: expect.any(Date) }]);
    });
  });

  describe('findByIdForSelf', () => {
    it('returns the payslip (with its pay period) when it belongs to the caller', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1' });
      payslips.findById.mockResolvedValue(makePayslip({ employeeId: 'emp-1' }));
      payRuns.findById.mockResolvedValue(makePayRun());

      const result = await service.findByIdForSelf('tenant-1', 'user-1', 'payslip-1');

      expect(result.employeeId).toBe('emp-1');
      expect(result.periodStart).toEqual(new Date('2026-01-01'));
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

    it("fetches Ghana's Tier 2 pension rate when recomputing a Ghana payslip", async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      lineItems.create.mockResolvedValue({ id: 'li-1' } as PayslipLineItem);
      rates.findEffective.mockImplementation((_countryCode, code) =>
        Promise.resolve(
          code === 'GHANA_TIER2_PENSION_EMPLOYER' ? ({ rate: 0.05 } as never) : ({ rate: 0.055 } as never),
        ),
      );

      await service.addLineItem('tenant-1', 'payslip-1', { type: 'EARNING', code: 'OVERTIME', amount: 150 });

      expect(rates.findEffective).toHaveBeenCalledWith('GH', 'GHANA_TIER2_PENSION_EMPLOYER', expect.any(Date));
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ ghanaTier2PensionEmployer: 50 }),
      );
    });

    it("throws ConflictException when Ghana's Tier 2 pension rate is missing", async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      rates.findEffective.mockImplementation((_countryCode, code) =>
        Promise.resolve(code === 'GHANA_TIER2_PENSION_EMPLOYER' ? null : ({ rate: 0.055 } as never)),
      );

      await expect(
        service.addLineItem('tenant-1', 'payslip-1', { type: 'EARNING', code: 'OVERTIME', amount: 150 }),
      ).rejects.toThrow(ConflictException);
    });

    it("fetches Kenya's SHIF and Housing Levy rates when recomputing a Kenya payslip", async () => {
      payslips.findById.mockResolvedValue(makePayslip({ countryCode: 'KE' }));
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      employees.findById.mockResolvedValue({
        id: 'emp-1',
        baseSalary: new Prisma.Decimal(50_000),
        currency: 'KES',
        countryCode: 'KE',
      } as never);
      lineItems.create.mockResolvedValue({ id: 'li-1' } as PayslipLineItem);
      rates.findEffective.mockImplementation((_countryCode, code) => {
        if (code === 'KENYA_SHIF_EMPLOYEE') return Promise.resolve({ rate: 0.0275 } as never);
        if (code === 'KENYA_HOUSING_LEVY_EMPLOYEE') return Promise.resolve({ rate: 0.015 } as never);
        if (code === 'KENYA_HOUSING_LEVY_EMPLOYER') return Promise.resolve({ rate: 0.015 } as never);
        return Promise.resolve({ rate: 0.06 } as never);
      });

      await service.addLineItem('tenant-1', 'payslip-1', { type: 'EARNING', code: 'BONUS', amount: 0 });

      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          kenyaShifEmployee: expect.any(Number),
          kenyaHousingLevyEmployee: expect.any(Number),
          kenyaHousingLevyEmployer: expect.any(Number),
        }),
      );
    });

    it("fetches Nigeria's NSITF/NHIS rates and the organization's employee count when recomputing a Nigeria payslip", async () => {
      payslips.findById.mockResolvedValue(makePayslip({ countryCode: 'NG' }));
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      employees.findById.mockResolvedValue({
        id: 'emp-1',
        organizationId: 'org-1',
        baseSalary: new Prisma.Decimal(100_000),
        currency: 'NGN',
        countryCode: 'NG',
      } as never);
      employees.listActiveByOrganization.mockResolvedValue(
        Array.from({ length: 5 }, () => ({})) as never,
      );
      lineItems.create.mockResolvedValue({ id: 'li-1' } as PayslipLineItem);
      rates.findEffective.mockImplementation((_countryCode, code) => {
        if (code === 'NIGERIA_NSITF_EMPLOYER') return Promise.resolve({ rate: 0.01 } as never);
        if (code === 'NIGERIA_NHIS_EMPLOYEE') return Promise.resolve({ rate: 0.05 } as never);
        if (code === 'NIGERIA_NHIS_EMPLOYER') return Promise.resolve({ rate: 0.1 } as never);
        return Promise.resolve({ rate: 0.08 } as never);
      });

      await service.addLineItem('tenant-1', 'payslip-1', { type: 'EARNING', code: 'BONUS', amount: 0 });

      expect(employees.listActiveByOrganization).toHaveBeenCalledWith('tenant-1', 'org-1');
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          nigeriaNsitfEmployer: 1000,
          nigeriaNhisEmployee: 5000,
          nigeriaNhisEmployer: 10_000,
        }),
      );
    });

    it("throws ConflictException when Nigeria's NSITF/NHIS rates are missing", async () => {
      payslips.findById.mockResolvedValue(makePayslip({ countryCode: 'NG' }));
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      employees.findById.mockResolvedValue({
        id: 'emp-1',
        organizationId: 'org-1',
        baseSalary: new Prisma.Decimal(100_000),
        currency: 'NGN',
        countryCode: 'NG',
      } as never);
      rates.findEffective.mockImplementation((_countryCode, code) =>
        Promise.resolve(code === 'NIGERIA_NSITF_EMPLOYER' ? null : ({ rate: 0.08 } as never)),
      );

      await expect(
        service.addLineItem('tenant-1', 'payslip-1', { type: 'EARNING', code: 'BONUS', amount: 0 }),
      ).rejects.toThrow(ConflictException);
    });

    it("includes the employee's active benefit enrollments in the recompute", async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      lineItems.create.mockResolvedValue({ id: 'li-1' } as PayslipLineItem);
      benefitEnrollments.listActiveForEmployee.mockResolvedValue([
        {
          contributionType: 'PERCENTAGE',
          employeeContribution: new Prisma.Decimal(0.02),
          employerContribution: new Prisma.Decimal(0.03),
        } as never,
      ]);

      await service.addLineItem('tenant-1', 'payslip-1', { type: 'EARNING', code: 'OVERTIME', amount: 0 });

      expect(benefitEnrollments.listActiveForEmployee).toHaveBeenCalledWith(
        'tenant-1',
        'emp-1',
        expect.any(Date),
      );
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ benefitsEmployeeDeduction: 20, benefitsEmployerCost: 30 }),
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
