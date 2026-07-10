import { BadRequestException } from '@nestjs/common';
import { PayrollCostReportRepository } from '@africahr/reporting-data-access';
import { PayrollCostReportService } from './payroll-cost-report.service';

describe('PayrollCostReportService', () => {
  let service: PayrollCostReportService;
  let payrollCost: jest.Mocked<PayrollCostReportRepository>;

  beforeEach(() => {
    payrollCost = {
      listPayslipCosts: jest.fn().mockResolvedValue([
        { grossPay: 3000, netPay: 2400, totalDeductions: 600, ssnitEmployer: 390 },
      ]),
    } as unknown as jest.Mocked<PayrollCostReportRepository>;

    service = new PayrollCostReportService(payrollCost);
  });

  it('rejects when from/to are missing', async () => {
    await expect(service.generate('tenant-1', {})).rejects.toThrow(BadRequestException);
    expect(payrollCost.listPayslipCosts).not.toHaveBeenCalled();
  });

  it('summarizes payslip costs for the given period', async () => {
    const result = await service.generate('tenant-1', { from: '2026-01-01', to: '2026-01-31' });

    expect(result).toEqual({
      payslipCount: 1,
      totalGrossPay: 3000,
      totalNetPay: 2400,
      totalDeductions: 600,
      totalEmployerCost: 3390,
    });
    expect(payrollCost.listPayslipCosts).toHaveBeenCalledWith('tenant-1', {
      organizationId: undefined,
      from: new Date('2026-01-01'),
      to: new Date('2026-01-31'),
    });
  });
});
