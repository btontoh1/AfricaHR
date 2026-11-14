import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { StatutoryTaxBandRepository } from './statutory-tax-band.repository';
import { StatutoryRateRepository } from './statutory-rate.repository';
import { PayRunRepository } from './pay-run.repository';
import { PayslipRepository } from './payslip.repository';
import { PayslipLineItemRepository } from './payslip-line-item.repository';
import { PayrollEmployeeRepository } from './payroll-employee.repository';
import { PayrollOrganizationRepository } from './payroll-organization.repository';
import { PayrollDisbursementRepository } from './payroll-disbursement.repository';
import { PayrollBenefitEnrollmentRepository } from './payroll-benefit-enrollment.repository';
import { PayrollLeaveRequestRepository } from './payroll-leave-request.repository';
import { PayrollAttendanceRecordRepository } from './payroll-attendance-record.repository';
import { PayrollWalletRepository } from './payroll-wallet.repository';
import { PayrollSubscriptionRepository } from './payroll-subscription.repository';
import { PayrollPaystackFeeRepository } from './payroll-paystack-fee.repository';
import { PayrollUserRepository } from './payroll-user.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    StatutoryTaxBandRepository,
    StatutoryRateRepository,
    PayRunRepository,
    PayslipRepository,
    PayslipLineItemRepository,
    PayrollEmployeeRepository,
    PayrollOrganizationRepository,
    PayrollDisbursementRepository,
    PayrollBenefitEnrollmentRepository,
    PayrollLeaveRequestRepository,
    PayrollAttendanceRecordRepository,
    PayrollWalletRepository,
    PayrollSubscriptionRepository,
    PayrollPaystackFeeRepository,
    PayrollUserRepository,
  ],
  exports: [
    StatutoryTaxBandRepository,
    StatutoryRateRepository,
    PayRunRepository,
    PayslipRepository,
    PayslipLineItemRepository,
    PayrollEmployeeRepository,
    PayrollOrganizationRepository,
    PayrollDisbursementRepository,
    PayrollBenefitEnrollmentRepository,
    PayrollLeaveRequestRepository,
    PayrollAttendanceRecordRepository,
    PayrollWalletRepository,
    PayrollSubscriptionRepository,
    PayrollPaystackFeeRepository,
    PayrollUserRepository,
  ],
})
export class PayrollDataAccessModule {}
