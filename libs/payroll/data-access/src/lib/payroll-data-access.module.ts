import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { StatutoryTaxBandRepository } from './statutory-tax-band.repository';
import { StatutoryRateRepository } from './statutory-rate.repository';
import { PayRunRepository } from './pay-run.repository';
import { PayslipRepository } from './payslip.repository';
import { PayslipLineItemRepository } from './payslip-line-item.repository';
import { PayrollEmployeeRepository } from './payroll-employee.repository';
import { PayrollDisbursementRepository } from './payroll-disbursement.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    StatutoryTaxBandRepository,
    StatutoryRateRepository,
    PayRunRepository,
    PayslipRepository,
    PayslipLineItemRepository,
    PayrollEmployeeRepository,
    PayrollDisbursementRepository,
  ],
  exports: [
    StatutoryTaxBandRepository,
    StatutoryRateRepository,
    PayRunRepository,
    PayslipRepository,
    PayslipLineItemRepository,
    PayrollEmployeeRepository,
    PayrollDisbursementRepository,
  ],
})
export class PayrollDataAccessModule {}
