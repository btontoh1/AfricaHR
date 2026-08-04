import { randomBytes } from 'node:crypto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PayRun, Prisma } from '@prisma/client';
import { AppConfigService, encryptAesGcm } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import {
  PayrollBenefitEnrollmentRepository,
  PayRunRepository,
  PayrollEmployeeRepository,
  PayrollLeaveRequestRepository,
  PayslipRepository,
  PayslipWithLineItems,
  StatutoryRateRepository,
  StatutoryTaxBandRepository,
} from '@africahr/payroll-data-access';
import { PAY_RUN_PROCESSED_EVENT, PayRunService } from './pay-run.service';
import { PaystackTransferClient } from './paystack-transfer-client';

const validEncryptionKey = randomBytes(32).toString('hex');

function encrypt(plaintext: string): string {
  return encryptAesGcm(plaintext, Buffer.from(validEncryptionKey, 'hex'));
}

describe('PayRunService', () => {
  let service: PayRunService;
  let payRuns: jest.Mocked<PayRunRepository>;
  let payslips: jest.Mocked<PayslipRepository>;
  let employees: jest.Mocked<PayrollEmployeeRepository>;
  let taxBands: jest.Mocked<StatutoryTaxBandRepository>;
  let rates: jest.Mocked<StatutoryRateRepository>;
  let benefitEnrollments: jest.Mocked<PayrollBenefitEnrollmentRepository>;
  let leaveRequests: jest.Mocked<PayrollLeaveRequestRepository>;
  let audit: jest.Mocked<AuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let paystack: jest.Mocked<PaystackTransferClient>;
  let config: AppConfigService;

  function makePayslip(overrides: Partial<PayslipWithLineItems> = {}): PayslipWithLineItems {
    return {
      id: 'payslip-1',
      tenantId: 'tenant-1',
      payRunId: 'run-1',
      employeeId: 'emp-1',
      status: 'PAID',
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
      disbursementStatus: 'NOT_INITIATED',
      paystackRecipientCode: null,
      paystackTransferReference: null,
      disbursedAt: null,
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
      status: 'DRAFT',
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
    payRuns = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<PayRunRepository>;

    payslips = {
      upsert: jest.fn(),
      findById: jest.fn(),
      findByPayRunAndEmployee: jest.fn().mockResolvedValue(null),
      listByPayRun: jest.fn().mockResolvedValue([]),
      updateManyStatusByPayRun: jest.fn(),
      recordDisbursementInitiated: jest.fn(),
      recordDisbursementResult: jest.fn(),
    } as unknown as jest.Mocked<PayslipRepository>;

    employees = {
      listActiveByOrganization: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findPaymentMethodByEmployeeId: jest.fn().mockResolvedValue(null),
      savePaystackRecipientCode: jest.fn(),
    } as unknown as jest.Mocked<PayrollEmployeeRepository>;

    taxBands = {
      findEffective: jest.fn().mockResolvedValue([
        { order: 1, lowerBound: 0, upperBound: null, rate: 0.1 },
      ]),
    } as unknown as jest.Mocked<StatutoryTaxBandRepository>;

    rates = {
      findEffective: jest.fn().mockResolvedValue({ rate: 0.055 }),
    } as unknown as jest.Mocked<StatutoryRateRepository>;

    benefitEnrollments = {
      listActiveForEmployee: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<PayrollBenefitEnrollmentRepository>;

    leaveRequests = {
      sumUnpaidDays: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<PayrollLeaveRequestRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    paystack = {
      createRecipient: jest.fn(),
      initiateTransfer: jest.fn(),
    } as unknown as jest.Mocked<PaystackTransferClient>;
    config = { paymentMethodEncryptionKey: validEncryptionKey } as unknown as AppConfigService;

    service = new PayRunService(
      payRuns,
      payslips,
      employees,
      taxBands,
      rates,
      benefitEnrollments,
      leaveRequests,
      audit,
      eventEmitter,
      paystack,
      config,
    );
  });

  it('fails to construct when PAYMENT_METHOD_ENCRYPTION_KEY is unset', () => {
    const badConfig = { paymentMethodEncryptionKey: undefined } as unknown as AppConfigService;

    expect(
      () =>
        new PayRunService(
          payRuns,
          payslips,
          employees,
          taxBands,
          rates,
          benefitEnrollments,
          leaveRequests,
          audit,
          eventEmitter,
          paystack,
          badConfig,
        ),
    ).toThrow(/PAYMENT_METHOD_ENCRYPTION_KEY must be set/);
  });

  describe('create', () => {
    it('rejects a period where periodEnd is not after periodStart', async () => {
      await expect(
        service.create('tenant-1', {
          organizationId: 'org-1',
          periodStart: '2026-01-31',
          periodEnd: '2026-01-01',
          payDate: '2026-02-01',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(payRuns.create).not.toHaveBeenCalled();
    });

    it('translates a foreign-key violation on organizationId into NotFoundException', async () => {
      payRuns.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('tenant-1', {
          organizationId: 'org-1',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
          payDate: '2026-02-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('translates a duplicate-period unique violation into ConflictException', async () => {
      payRuns.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique violation', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('tenant-1', {
          organizationId: 'org-1',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
          payDate: '2026-02-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('records an audit entry on success', async () => {
      const created = makePayRun();
      payRuns.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        { organizationId: 'org-1', periodStart: '2026-01-01', periodEnd: '2026-01-31', payDate: '2026-02-01' },
        'mgr-1',
      );

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'payroll.pay_run.created', resourceId: created.id }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the pay run does not exist', async () => {
      payRuns.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('process', () => {
    it('rejects processing a locked (non-editable) pay run', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));

      await expect(service.process('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
    });

    it('computes and upserts a payslip for each active employee, then transitions DRAFT to PROCESSING', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Kwame',
          lastName: 'Asante',
          baseSalary: new Prisma.Decimal(1000),
          currency: 'GHS',
          annualRentPaid: null,
          countryCode: 'GH',
        },
      ]);
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));

      await service.process('tenant-1', 'run-1', 'mgr-1');

      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ payRunId: 'run-1', employeeId: 'emp-1', countryCode: 'GH', currency: 'GHS' }),
      );
      expect(payRuns.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'run-1',
        expect.objectContaining({ status: 'PROCESSING' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'payroll.pay_run.processed' }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PAY_RUN_PROCESSED_EVENT,
        expect.objectContaining({
          tenantId: 'tenant-1',
          payRunId: 'run-1',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
          employeeCount: 1,
          actorUserId: 'mgr-1',
        }),
      );
    });

    it('does not emit a notification when reprocessing an already-PROCESSING run', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      employees.listActiveByOrganization.mockResolvedValue([]);

      await service.process('tenant-1', 'run-1');

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('derives the payslip currency from country when the employee has none set, instead of hardcoding GHS', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Chidi',
          lastName: 'Okafor',
          baseSalary: new Prisma.Decimal(1000),
          currency: null,
          annualRentPaid: null,
          countryCode: 'NG',
        },
      ]);
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));

      await service.process('tenant-1', 'run-1');

      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeId: 'emp-1', countryCode: 'NG', currency: 'NGN' }),
      );
    });

    it('passes the employee\'s annual rent paid through so Nigeria rent relief reduces PAYE', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Chidi',
          lastName: 'Okafor',
          baseSalary: new Prisma.Decimal(100_000),
          currency: 'NGN',
          annualRentPaid: new Prisma.Decimal(1_200_000),
          countryCode: 'NG',
        },
      ]);
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));

      await service.process('tenant-1', 'run-1');

      // flat 10% mock band, 5.5% mock pension rate (see beforeEach):
      // ssnit = 100,000 * 0.055 = 5,500
      // rent relief = min(20% of 1,200,000, 500,000)/12 = 20,000
      // taxable = 100,000 - 5,500 - 20,000 = 74,500; PAYE = 74,500 * 0.1 = 7,450
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          employeeId: 'emp-1',
          taxableIncome: 74500,
          payeTax: 7450,
          netPay: 87050,
        }),
      );
    });

    it("deducts the employee's active benefit enrollments from net pay", async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Kwame',
          lastName: 'Asante',
          baseSalary: new Prisma.Decimal(1000),
          currency: 'GHS',
          annualRentPaid: null,
          countryCode: 'GH',
        },
      ]);
      benefitEnrollments.listActiveForEmployee.mockResolvedValue([
        {
          contributionType: 'PERCENTAGE',
          employeeContribution: new Prisma.Decimal(0.02),
          employerContribution: new Prisma.Decimal(0.03),
        } as never,
      ]);
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));

      await service.process('tenant-1', 'run-1');

      expect(benefitEnrollments.listActiveForEmployee).toHaveBeenCalledWith(
        'tenant-1',
        'emp-1',
        expect.any(Date),
      );
      // benefit employee = 1000 * 0.02 = 20, on top of the 5.5% mock pension (55) and 10% flat-band PAYE
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ benefitsEmployeeDeduction: 20, benefitsEmployerCost: 30 }),
      );
    });

    it("reduces the employee's basic salary/gross pay for unpaid leave taken within the pay period", async () => {
      payRuns.findById.mockResolvedValue(
        makePayRun({ status: 'DRAFT', periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-01-31') }),
      );
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Kwame',
          lastName: 'Asante',
          baseSalary: new Prisma.Decimal(2000),
          currency: 'GHS',
          annualRentPaid: null,
          countryCode: 'GH',
        },
      ]);
      // Jan 2026 has 22 working days; 2 unpaid days at 2000 = (2000/22)*2 ≈ 181.82
      leaveRequests.sumUnpaidDays.mockResolvedValue(2);
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));

      await service.process('tenant-1', 'run-1');

      expect(leaveRequests.sumUnpaidDays).toHaveBeenCalledWith(
        'tenant-1',
        'emp-1',
        new Date('2026-01-01'),
        new Date('2026-01-31'),
      );
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ unpaidLeaveDeduction: 181.82, basicSalary: 1818.18 }),
      );
    });

    it('does not re-transition status when reprocessing an already-PROCESSING run', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      employees.listActiveByOrganization.mockResolvedValue([]);

      await service.process('tenant-1', 'run-1');

      expect(payRuns.updateStatus).not.toHaveBeenCalled();
    });

    it('throws ConflictException when no effective statutory configuration exists for a country', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Kwame',
          lastName: 'Asante',
          baseSalary: new Prisma.Decimal(1000),
          currency: 'GHS',
          annualRentPaid: null,
          countryCode: 'NG',
        },
      ]);
      taxBands.findEffective.mockResolvedValue([]);

      await expect(service.process('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
    });

    it("fetches Ghana's Tier 2 pension rate and applies it as an employer-only cost", async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Kwame',
          lastName: 'Asante',
          baseSalary: new Prisma.Decimal(1000),
          currency: 'GHS',
          annualRentPaid: null,
          countryCode: 'GH',
        },
      ]);
      rates.findEffective.mockImplementation((_countryCode, code) =>
        Promise.resolve(
          code === 'GHANA_TIER2_PENSION_EMPLOYER' ? ({ rate: 0.05 } as never) : ({ rate: 0.055 } as never),
        ),
      );

      await service.process('tenant-1', 'run-1');

      expect(rates.findEffective).toHaveBeenCalledWith('GH', 'GHANA_TIER2_PENSION_EMPLOYER', expect.any(Date));
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ ghanaTier2PensionEmployer: 50 }),
      );
    });

    it("throws ConflictException when Ghana's Tier 2 pension rate is missing", async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Kwame',
          lastName: 'Asante',
          baseSalary: new Prisma.Decimal(1000),
          currency: 'GHS',
          annualRentPaid: null,
          countryCode: 'GH',
        },
      ]);
      rates.findEffective.mockImplementation((_countryCode, code) =>
        Promise.resolve(code === 'GHANA_TIER2_PENSION_EMPLOYER' ? null : ({ rate: 0.055 } as never)),
      );

      await expect(service.process('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
    });

    it("fetches Kenya's SHIF and Housing Levy rates and applies them", async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Amina',
          lastName: 'Wanjiru',
          baseSalary: new Prisma.Decimal(50_000),
          currency: 'KES',
          annualRentPaid: null,
          countryCode: 'KE',
        },
      ]);
      rates.findEffective.mockImplementation((_countryCode, code) => {
        if (code === 'KENYA_SHIF_EMPLOYEE') return Promise.resolve({ rate: 0.0275 } as never);
        if (code === 'KENYA_HOUSING_LEVY_EMPLOYEE') return Promise.resolve({ rate: 0.015 } as never);
        if (code === 'KENYA_HOUSING_LEVY_EMPLOYER') return Promise.resolve({ rate: 0.015 } as never);
        return Promise.resolve({ rate: 0.06 } as never);
      });

      await service.process('tenant-1', 'run-1');

      expect(rates.findEffective).toHaveBeenCalledWith('KE', 'KENYA_SHIF_EMPLOYEE', expect.any(Date));
      expect(rates.findEffective).toHaveBeenCalledWith('KE', 'KENYA_HOUSING_LEVY_EMPLOYEE', expect.any(Date));
      expect(rates.findEffective).toHaveBeenCalledWith('KE', 'KENYA_HOUSING_LEVY_EMPLOYER', expect.any(Date));
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          kenyaShifEmployee: 1375,
          kenyaHousingLevyEmployee: 750,
          kenyaHousingLevyEmployer: 750,
        }),
      );
    });

    it.each(['KENYA_SHIF_EMPLOYEE', 'KENYA_HOUSING_LEVY_EMPLOYEE', 'KENYA_HOUSING_LEVY_EMPLOYER'])(
      'throws ConflictException when Kenya\'s %s rate is missing',
      async (missingCode) => {
        payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
        employees.listActiveByOrganization.mockResolvedValue([
          {
            id: 'emp-1',
            organizationId: 'org-1',
            firstName: 'Amina',
            lastName: 'Wanjiru',
            baseSalary: new Prisma.Decimal(50_000),
            currency: 'KES',
            annualRentPaid: null,
            countryCode: 'KE',
          },
        ]);
        rates.findEffective.mockImplementation((_countryCode, code) =>
          Promise.resolve(code === missingCode ? null : ({ rate: 0.06 } as never)),
        );

        await expect(service.process('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
      },
    );

    it('does not fetch Ghana or Kenya extra rates for a Nigeria payslip', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue([
        {
          id: 'emp-1',
          organizationId: 'org-1',
          firstName: 'Chidi',
          lastName: 'Okafor',
          baseSalary: new Prisma.Decimal(100_000),
          currency: 'NGN',
          annualRentPaid: null,
          countryCode: 'NG',
        },
      ]);

      await service.process('tenant-1', 'run-1');

      expect(rates.findEffective).not.toHaveBeenCalledWith('NG', 'GHANA_TIER2_PENSION_EMPLOYER', expect.any(Date));
      expect(rates.findEffective).not.toHaveBeenCalledWith('NG', 'KENYA_SHIF_EMPLOYEE', expect.any(Date));
    });

    function makeNigerianEmployees(count: number): Array<Record<string, unknown>> {
      return Array.from({ length: count }, (_unused, i) => ({
        id: `emp-${i + 1}`,
        organizationId: 'org-1',
        firstName: 'Chidi',
        lastName: 'Okafor',
        baseSalary: new Prisma.Decimal(100_000),
        currency: 'NGN',
        annualRentPaid: null,
        countryCode: 'NG',
      }));
    }

    it("fetches Nigeria's NSITF/NHIS rates and applies them once the organization meets the 5-employee threshold", async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue(makeNigerianEmployees(5) as never);
      rates.findEffective.mockImplementation((_countryCode, code) => {
        if (code === 'NIGERIA_NSITF_EMPLOYER') return Promise.resolve({ rate: 0.01 } as never);
        if (code === 'NIGERIA_NHIS_EMPLOYEE') return Promise.resolve({ rate: 0.05 } as never);
        if (code === 'NIGERIA_NHIS_EMPLOYER') return Promise.resolve({ rate: 0.1 } as never);
        return Promise.resolve({ rate: 0.08 } as never);
      });

      await service.process('tenant-1', 'run-1');

      expect(rates.findEffective).toHaveBeenCalledWith('NG', 'NIGERIA_NSITF_EMPLOYER', expect.any(Date));
      expect(rates.findEffective).toHaveBeenCalledWith('NG', 'NIGERIA_NHIS_EMPLOYEE', expect.any(Date));
      expect(rates.findEffective).toHaveBeenCalledWith('NG', 'NIGERIA_NHIS_EMPLOYER', expect.any(Date));
      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          employeeId: 'emp-1',
          nigeriaNsitfEmployer: 1000,
          nigeriaNhisEmployee: 5000,
          nigeriaNhisEmployer: 10_000,
        }),
      );
    });

    it("throws ConflictException when Nigeria's NSITF/NHIS rates are missing, even for a small organization", async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue(makeNigerianEmployees(2) as never);
      rates.findEffective.mockImplementation((_countryCode, code) =>
        Promise.resolve(code === 'NIGERIA_NSITF_EMPLOYER' ? null : ({ rate: 0.08 } as never)),
      );

      await expect(service.process('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
    });

    it("does not apply Nigeria's NSITF/NHIS when the organization is under the 5-employee threshold, even though the rates are required and fetched", async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      employees.listActiveByOrganization.mockResolvedValue(makeNigerianEmployees(2) as never);
      rates.findEffective.mockImplementation((_countryCode, code) => {
        if (code === 'NIGERIA_NSITF_EMPLOYER') return Promise.resolve({ rate: 0.01 } as never);
        if (code === 'NIGERIA_NHIS_EMPLOYEE') return Promise.resolve({ rate: 0.05 } as never);
        if (code === 'NIGERIA_NHIS_EMPLOYER') return Promise.resolve({ rate: 0.1 } as never);
        return Promise.resolve({ rate: 0.08 } as never);
      });

      await service.process('tenant-1', 'run-1');

      expect(payslips.upsert).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ nigeriaNsitfEmployer: 0, nigeriaNhisEmployee: 0, nigeriaNhisEmployer: 0 }),
      );
    });
  });

  describe('approve', () => {
    it('rejects approving a pay run that is not PROCESSING', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));

      await expect(service.approve('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
    });

    it('rejects approving a pay run with no payslips', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      payslips.listByPayRun.mockResolvedValue([]);

      await expect(service.approve('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
    });

    it('approves, locks payslips, and audits on success', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PROCESSING' }));
      payslips.listByPayRun.mockResolvedValue([{ id: 'payslip-1' }] as never);
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'APPROVED' }));

      await service.approve('tenant-1', 'run-1', 'mgr-1');

      expect(payslips.updateManyStatusByPayRun).toHaveBeenCalledWith('tenant-1', 'run-1', 'APPROVED', 'mgr-1');
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'payroll.pay_run.approved' }));
    });
  });

  describe('markPaid', () => {
    it('rejects marking a DRAFT pay run as paid', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));

      await expect(service.markPaid('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
    });

    it('marks an APPROVED pay run as PAID and cascades payslip status', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PAID' }));

      await service.markPaid('tenant-1', 'run-1', 'mgr-1');

      expect(payslips.updateManyStatusByPayRun).toHaveBeenCalledWith('tenant-1', 'run-1', 'PAID', 'mgr-1');
    });

    it('initiates a Paystack transfer for a payslip whose employee has a usable payment method', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PAID' }));
      payslips.listByPayRun.mockResolvedValue([makePayslip({ countryCode: 'GH', currency: 'GHS', netPay: new Prisma.Decimal(856) })]);
      employees.findPaymentMethodByEmployeeId.mockResolvedValue({
        type: 'BANK_ACCOUNT',
        bankCode: encrypt('040'),
        accountNumber: encrypt('1234567890'),
        accountName: encrypt('Kwame Asante'),
        mobileMoneyNumber: null,
        paystackRecipientCode: null,
      });
      employees.findById.mockResolvedValue({
        id: 'emp-1',
        organizationId: 'org-1',
        firstName: 'Kwame',
        lastName: 'Asante',
        baseSalary: new Prisma.Decimal(1000),
        currency: 'GHS',
        annualRentPaid: null,
        countryCode: 'GH',
      });
      paystack.createRecipient.mockResolvedValue({ recipientCode: 'RCP_abc' });
      paystack.initiateTransfer.mockResolvedValue({ transferCode: 'TRF_abc', reference: 'ref-123', status: 'pending' });

      await service.markPaid('tenant-1', 'run-1', 'mgr-1');

      expect(paystack.createRecipient).toHaveBeenCalledWith({
        type: 'ghipss',
        name: 'Kwame Asante',
        accountNumber: '1234567890',
        bankCode: '040',
        currency: 'GHS',
      });
      expect(paystack.initiateTransfer).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 856, currency: 'GHS', recipientCode: 'RCP_abc' }),
      );
      expect(payslips.recordDisbursementInitiated).toHaveBeenCalledWith(
        'tenant-1',
        'payslip-1',
        expect.objectContaining({ paystackRecipientCode: 'RCP_abc' }),
      );
    });

    it('skips disbursement for a payslip with no net pay', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PAID' }));
      payslips.listByPayRun.mockResolvedValue([makePayslip({ netPay: new Prisma.Decimal(0) })]);

      await service.markPaid('tenant-1', 'run-1');

      expect(employees.findPaymentMethodByEmployeeId).not.toHaveBeenCalled();
      expect(paystack.createRecipient).not.toHaveBeenCalled();
    });

    it('skips disbursement for an employee with no payment method on file, without failing the whole call', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PAID' }));
      payslips.listByPayRun.mockResolvedValue([makePayslip()]);
      employees.findPaymentMethodByEmployeeId.mockResolvedValue(null);

      await expect(service.markPaid('tenant-1', 'run-1')).resolves.toBeDefined();

      expect(paystack.createRecipient).not.toHaveBeenCalled();
      expect(payslips.recordDisbursementInitiated).not.toHaveBeenCalled();
    });

    it('skips disbursement for a payment-method/country combination Paystack does not support', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PAID' }));
      payslips.listByPayRun.mockResolvedValue([makePayslip({ countryCode: 'NG' })]);
      employees.findPaymentMethodByEmployeeId.mockResolvedValue({
        type: 'MOBILE_MONEY',
        bankCode: encrypt('MTN'),
        accountNumber: null,
        accountName: null,
        mobileMoneyNumber: encrypt('0244000000'),
        paystackRecipientCode: null,
      });

      await service.markPaid('tenant-1', 'run-1');

      expect(paystack.createRecipient).not.toHaveBeenCalled();
    });

    it('does not let one employee\'s Paystack failure block the pay run from being marked paid or the rest from being disbursed', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PAID' }));
      payslips.listByPayRun.mockResolvedValue([
        makePayslip({ id: 'payslip-1', employeeId: 'emp-1' }),
        makePayslip({ id: 'payslip-2', employeeId: 'emp-2' }),
      ]);
      employees.findPaymentMethodByEmployeeId.mockResolvedValue({
        type: 'BANK_ACCOUNT',
        bankCode: encrypt('040'),
        accountNumber: encrypt('1234567890'),
        accountName: encrypt('Test Employee'),
        mobileMoneyNumber: null,
        paystackRecipientCode: null,
      });
      employees.findById.mockResolvedValue({
        id: 'emp-1',
        organizationId: 'org-1',
        firstName: 'Test',
        lastName: 'Employee',
        baseSalary: new Prisma.Decimal(1000),
        currency: 'GHS',
        annualRentPaid: null,
        countryCode: 'GH',
      });
      paystack.createRecipient
        .mockRejectedValueOnce(new Error('Paystack is down'))
        .mockResolvedValueOnce({ recipientCode: 'RCP_abc' });
      paystack.initiateTransfer.mockResolvedValue({ transferCode: 'TRF_abc', reference: 'ref-123', status: 'pending' });

      const result = await service.markPaid('tenant-1', 'run-1', 'mgr-1');

      expect(result.status).toBe('PAID');
      expect(paystack.createRecipient).toHaveBeenCalledTimes(2);
      expect(payslips.recordDisbursementInitiated).toHaveBeenCalledTimes(1);
    });

    it('marks a payslip FAILED and notifies when recipient creation fails', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PAID' }));
      payslips.listByPayRun.mockResolvedValue([makePayslip({ countryCode: 'GH', currency: 'GHS' })]);
      employees.findPaymentMethodByEmployeeId.mockResolvedValue({
        type: 'BANK_ACCOUNT',
        bankCode: encrypt('040'),
        accountNumber: encrypt('1234567890'),
        accountName: encrypt('Test Employee'),
        mobileMoneyNumber: null,
        paystackRecipientCode: null,
      });
      employees.findById.mockResolvedValue({
        id: 'emp-1',
        organizationId: 'org-1',
        firstName: 'Test',
        lastName: 'Employee',
        baseSalary: new Prisma.Decimal(1000),
        currency: 'GHS',
        annualRentPaid: null,
        countryCode: 'GH',
      });
      paystack.createRecipient.mockRejectedValue(new Error('Invalid bank code'));

      await service.markPaid('tenant-1', 'run-1', 'mgr-1');

      expect(paystack.initiateTransfer).not.toHaveBeenCalled();
      expect(payslips.recordDisbursementInitiated).not.toHaveBeenCalled();
      expect(payslips.recordDisbursementResult).toHaveBeenCalledWith('tenant-1', 'payslip-1', 'FAILED');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'payroll.payslip.disbursement_failed',
        expect.objectContaining({ tenantId: 'tenant-1', employeeName: 'Test Employee' }),
      );
    });

    it('records PENDING before calling Paystack and leaves it PENDING (not FAILED) when the transfer call itself errors', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'PAID' }));
      payslips.listByPayRun.mockResolvedValue([makePayslip({ countryCode: 'GH', currency: 'GHS' })]);
      employees.findPaymentMethodByEmployeeId.mockResolvedValue({
        type: 'BANK_ACCOUNT',
        bankCode: encrypt('040'),
        accountNumber: encrypt('1234567890'),
        accountName: encrypt('Test Employee'),
        mobileMoneyNumber: null,
        paystackRecipientCode: null,
      });
      employees.findById.mockResolvedValue({
        id: 'emp-1',
        organizationId: 'org-1',
        firstName: 'Test',
        lastName: 'Employee',
        baseSalary: new Prisma.Decimal(1000),
        currency: 'GHS',
        annualRentPaid: null,
        countryCode: 'GH',
      });
      paystack.createRecipient.mockResolvedValue({ recipientCode: 'RCP_abc' });
      paystack.initiateTransfer.mockRejectedValue(new Error('Network timeout'));

      await service.markPaid('tenant-1', 'run-1', 'mgr-1');

      // Committed before the (failing) Paystack call, not after - the whole
      // point of the reordering (see disburse()'s docstring).
      expect(payslips.recordDisbursementInitiated).toHaveBeenCalledWith(
        'tenant-1',
        'payslip-1',
        expect.objectContaining({ paystackRecipientCode: 'RCP_abc' }),
      );
      expect(payslips.recordDisbursementResult).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('allows cancellation from DRAFT', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'DRAFT' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'CANCELLED' }));

      await service.cancel('tenant-1', 'run-1');

      expect(payRuns.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'run-1',
        expect.objectContaining({ status: 'CANCELLED' }),
      );
    });

    it('rejects cancellation once PAID', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PAID' }));

      await expect(service.cancel('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('close', () => {
    it('closes a PAID pay run', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'PAID' }));
      payRuns.updateStatus.mockResolvedValue(makePayRun({ status: 'CLOSED' }));

      await service.close('tenant-1', 'run-1');

      expect(payRuns.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'run-1',
        expect.objectContaining({ status: 'CLOSED' }),
      );
    });

    it('rejects closing a run that has not been paid', async () => {
      payRuns.findById.mockResolvedValue(makePayRun({ status: 'APPROVED' }));

      await expect(service.close('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
    });
  });
});
