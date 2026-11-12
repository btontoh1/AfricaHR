import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Payslip, PayRun, Prisma } from '@prisma/client';
import { AppConfigService } from '@africahr/platform-core';
import { MessagingDispatcher } from '@africahr/platform-messaging';
import {
  PayrollEligibleEmployee,
  PayrollEmployeeRepository,
  PayRunRepository,
  PayslipRepository,
  PayslipWithLineItems,
} from '@africahr/payroll-data-access';
import { PayslipMessagingService } from './payslip-messaging.service';

describe('PayslipMessagingService', () => {
  let service: PayslipMessagingService;
  let payslips: jest.Mocked<PayslipRepository>;
  let payRuns: jest.Mocked<PayRunRepository>;
  let employees: jest.Mocked<PayrollEmployeeRepository>;
  let dispatcher: jest.Mocked<MessagingDispatcher>;
  let config: AppConfigService;

  function makePayslip(overrides: Partial<Payslip> = {}): PayslipWithLineItems {
    return {
      id: 'payslip-1',
      tenantId: 'tenant-1',
      payRunId: 'run-1',
      employeeId: 'emp-1',
      status: 'PAID',
      countryCode: 'GH',
      basicSalary: new Prisma.Decimal(800),
      grossPay: new Prisma.Decimal(920),
      taxableIncome: new Prisma.Decimal(900),
      payeTax: new Prisma.Decimal(50),
      ssnitEmployee: new Prisma.Decimal(30),
      ssnitEmployer: new Prisma.Decimal(70),
      ghanaTier2PensionEmployer: new Prisma.Decimal(0),
      kenyaShifEmployee: new Prisma.Decimal(0),
      kenyaHousingLevyEmployee: new Prisma.Decimal(0),
      kenyaHousingLevyEmployer: new Prisma.Decimal(0),
      nigeriaNsitfEmployer: new Prisma.Decimal(0),
      nigeriaNhisEmployee: new Prisma.Decimal(0),
      nigeriaNhisEmployer: new Prisma.Decimal(0),
      benefitsEmployeeDeduction: new Prisma.Decimal(0),
      benefitsEmployerCost: new Prisma.Decimal(0),
      unpaidLeaveDeduction: new Prisma.Decimal(0),
      overtimePay: new Prisma.Decimal(120),
      regularHoursWorked: null,
      hourlyRateApplied: null,
      totalDeductions: new Prisma.Decimal(80),
      netPay: new Prisma.Decimal(840),
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
      periodStart: new Date('2026-11-01'),
      periodEnd: new Date('2026-11-30'),
      payDate: new Date('2026-11-30'),
      status: 'PAID',
      approvedAt: null,
      approvedBy: null,
      paidAt: new Date('2026-11-30'),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as PayRun;
  }

  function makeEmployee(overrides: Partial<PayrollEligibleEmployee> = {}): PayrollEligibleEmployee {
    return {
      id: 'emp-1',
      firstName: 'Esi',
      lastName: 'Appiah',
      organizationId: 'org-1',
      baseSalary: null,
      currency: 'GHS',
      annualRentPaid: null,
      countryCode: 'GH',
      compensationType: 'SALARY',
      hourlyRate: null,
      phone: '+233241234567',
      payslipSmsEnabled: true,
      payslipWhatsappEnabled: false,
      ...overrides,
    };
  }

  beforeEach(() => {
    payslips = {
      listByPayRun: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<PayslipRepository>;

    payRuns = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<PayRunRepository>;

    employees = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<PayrollEmployeeRepository>;

    dispatcher = {
      sendSms: jest.fn().mockResolvedValue({ success: true }),
      sendWhatsApp: jest.fn().mockResolvedValue({ success: true }),
    } as unknown as jest.Mocked<MessagingDispatcher>;

    config = { twilio: { whatsappPayslipTemplateSid: undefined } } as unknown as AppConfigService;

    service = new PayslipMessagingService(payslips, payRuns, employees, dispatcher, config);
  });

  describe('sendForPayRun', () => {
    it('sends an SMS to each payslip-eligible employee with the right summary text', async () => {
      payRuns.findById.mockResolvedValue(makePayRun());
      payslips.listByPayRun.mockResolvedValue([makePayslip()]);
      employees.findById.mockResolvedValue(makeEmployee());

      await service.sendForPayRun('tenant-1', 'run-1');

      expect(dispatcher.sendSms).toHaveBeenCalledWith(
        '+233241234567',
        'Payslip for Nov 2026: Gross GHS920.00, Net GHS840.00. Paid 30 Nov.',
      );
    });

    it('skips an employee with neither channel enabled, without erroring', async () => {
      payRuns.findById.mockResolvedValue(makePayRun());
      payslips.listByPayRun.mockResolvedValue([makePayslip()]);
      employees.findById.mockResolvedValue(makeEmployee({ payslipSmsEnabled: false, payslipWhatsappEnabled: false }));

      await service.sendForPayRun('tenant-1', 'run-1');

      expect(dispatcher.sendSms).not.toHaveBeenCalled();
      expect(dispatcher.sendWhatsApp).not.toHaveBeenCalled();
    });

    it('skips an employee with an invalid phone number, without erroring', async () => {
      payRuns.findById.mockResolvedValue(makePayRun());
      payslips.listByPayRun.mockResolvedValue([makePayslip()]);
      employees.findById.mockResolvedValue(makeEmployee({ phone: '0241234567' }));

      await service.sendForPayRun('tenant-1', 'run-1');

      expect(dispatcher.sendSms).not.toHaveBeenCalled();
    });

    it('skips WhatsApp when no template SID is configured, but still sends SMS', async () => {
      payRuns.findById.mockResolvedValue(makePayRun());
      payslips.listByPayRun.mockResolvedValue([makePayslip()]);
      employees.findById.mockResolvedValue(
        makeEmployee({ payslipSmsEnabled: true, payslipWhatsappEnabled: true }),
      );

      await service.sendForPayRun('tenant-1', 'run-1');

      expect(dispatcher.sendSms).toHaveBeenCalled();
      expect(dispatcher.sendWhatsApp).not.toHaveBeenCalled();
    });

    it('sends WhatsApp via the Content API template when a template SID is configured', async () => {
      config = { twilio: { whatsappPayslipTemplateSid: 'HX123' } } as unknown as AppConfigService;
      service = new PayslipMessagingService(payslips, payRuns, employees, dispatcher, config);
      payRuns.findById.mockResolvedValue(makePayRun());
      payslips.listByPayRun.mockResolvedValue([makePayslip()]);
      employees.findById.mockResolvedValue(
        makeEmployee({ payslipSmsEnabled: false, payslipWhatsappEnabled: true }),
      );

      await service.sendForPayRun('tenant-1', 'run-1');

      expect(dispatcher.sendWhatsApp).toHaveBeenCalledWith('+233241234567', 'HX123', {
        '1': 'Nov 2026',
        '2': 'GHS920.00',
        '3': 'GHS840.00',
        '4': '30 Nov',
      });
    });

    it('continues to the next payslip when one employee lookup throws', async () => {
      payRuns.findById.mockResolvedValue(makePayRun());
      payslips.listByPayRun.mockResolvedValue([
        makePayslip({ id: 'payslip-1', employeeId: 'emp-1' }),
        makePayslip({ id: 'payslip-2', employeeId: 'emp-2' }),
      ]);
      employees.findById
        .mockRejectedValueOnce(new Error('DB blip'))
        .mockResolvedValueOnce(makeEmployee({ id: 'emp-2' }));

      await service.sendForPayRun('tenant-1', 'run-1');

      expect(dispatcher.sendSms).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendForPayslip', () => {
    it('rejects when the employee has neither channel enabled', async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun());
      employees.findById.mockResolvedValue(
        makeEmployee({ payslipSmsEnabled: false, payslipWhatsappEnabled: false }),
      );

      await expect(service.sendForPayslip('tenant-1', 'payslip-1')).rejects.toThrow(BadRequestException);
      expect(dispatcher.sendSms).not.toHaveBeenCalled();
    });

    it('rejects when the employee has no valid phone', async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun());
      employees.findById.mockResolvedValue(makeEmployee({ phone: null }));

      await expect(service.sendForPayslip('tenant-1', 'payslip-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the payslip does not exist', async () => {
      payslips.findById.mockResolvedValue(null);

      await expect(service.sendForPayslip('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('sends the message when the employee is eligible', async () => {
      payslips.findById.mockResolvedValue(makePayslip());
      payRuns.findById.mockResolvedValue(makePayRun());
      employees.findById.mockResolvedValue(makeEmployee());

      await service.sendForPayslip('tenant-1', 'payslip-1');

      expect(dispatcher.sendSms).toHaveBeenCalledWith('+233241234567', expect.stringContaining('Payslip for'));
    });
  });
});
