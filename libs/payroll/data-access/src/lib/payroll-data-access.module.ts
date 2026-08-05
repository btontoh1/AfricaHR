import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { StatutoryTaxBandRepository } from './statutory-tax-band.repository';
import { StatutoryRateRepository } from './statutory-rate.repository';
import { PayRunRepository } from './pay-run.repository';
import { PayslipRepository } from './payslip.repository';
import { PayslipLineItemRepository } from './payslip-line-item.repository';
import { PayrollEmployeeRepository } from './payroll-employee.repository';
import { PayrollDisbursementRepository } from './payroll-disbursement.repository';
import { PayrollBenefitEnrollmentRepository } from './payroll-benefit-enrollment.repository';
import { PayrollLeaveRequestRepository } from './payroll-leave-request.repository';
import { PayrollAttendanceRecordRepository } from './payroll-attendance-record.repository';

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
    PayrollBenefitEnrollmentRepository,
    PayrollLeaveRequestRepository,
    PayrollAttendanceRecordRepository,
  ],
  exports: [
    StatutoryTaxBandRepository,
    StatutoryRateRepository,
    PayRunRepository,
    PayslipRepository,
    PayslipLineItemRepository,
    PayrollEmployeeRepository,
    PayrollDisbursementRepository,
    PayrollBenefitEnrollmentRepository,
    PayrollLeaveRequestRepository,
    PayrollAttendanceRecordRepository,
  ],
})
export class PayrollDataAccessModule {}
