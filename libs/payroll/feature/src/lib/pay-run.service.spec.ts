import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PayRun, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  PayRunRepository,
  PayrollEmployeeRepository,
  PayslipRepository,
  StatutoryRateRepository,
  StatutoryTaxBandRepository,
} from '@africahr/payroll-data-access';
import { PAY_RUN_PROCESSED_EVENT, PayRunService } from './pay-run.service';

describe('PayRunService', () => {
  let service: PayRunService;
  let payRuns: jest.Mocked<PayRunRepository>;
  let payslips: jest.Mocked<PayslipRepository>;
  let employees: jest.Mocked<PayrollEmployeeRepository>;
  let taxBands: jest.Mocked<StatutoryTaxBandRepository>;
  let rates: jest.Mocked<StatutoryRateRepository>;
  let audit: jest.Mocked<AuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

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
      findByPayRunAndEmployee: jest.fn().mockResolvedValue(null),
      listByPayRun: jest.fn(),
      updateManyStatusByPayRun: jest.fn(),
    } as unknown as jest.Mocked<PayslipRepository>;

    employees = {
      listActiveByOrganization: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
    } as unknown as jest.Mocked<PayrollEmployeeRepository>;

    taxBands = {
      findEffective: jest.fn().mockResolvedValue([
        { order: 1, lowerBound: 0, upperBound: null, rate: 0.1 },
      ]),
    } as unknown as jest.Mocked<StatutoryTaxBandRepository>;

    rates = {
      findEffective: jest.fn().mockResolvedValue({ rate: 0.055 }),
    } as unknown as jest.Mocked<StatutoryRateRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new PayRunService(payRuns, payslips, employees, taxBands, rates, audit, eventEmitter);
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
          baseSalary: new Prisma.Decimal(1000),
          currency: 'GHS',
          annualRentPaid: null,
          countryCode: 'NG',
        },
      ]);
      taxBands.findEffective.mockResolvedValue([]);

      await expect(service.process('tenant-1', 'run-1')).rejects.toThrow(ConflictException);
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
