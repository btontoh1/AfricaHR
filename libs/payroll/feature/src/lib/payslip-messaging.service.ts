import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Payslip } from '@prisma/client';
import { AppConfigService, isValidE164PhoneNumber } from '@africahr/platform-core';
import { MessagingDispatcher } from '@africahr/platform-messaging';
import { PayrollEligibleEmployee, PayrollEmployeeRepository, PayRunRepository, PayslipRepository } from '@africahr/payroll-data-access';

function formatMoney(currency: string, amount: Payslip['netPay']): string {
  return `${currency}${Number(amount).toFixed(2)}`;
}

/**
 * Sends a plain-text payslip summary by SMS/WhatsApp, opt-in per employee
 * (Employee.payslipSmsEnabled/payslipWhatsappEnabled) - reaches workers who
 * may have no User account at all (e.g. kiosk-only hourly staff), unlike
 * NotificationService which is User/email-centric. Best-effort: a failed or
 * skipped send for one employee never affects another, and never affects
 * the pay run itself (this is always called after PayRunService.markPaid
 * has already committed).
 */
@Injectable()
export class PayslipMessagingService {
  private readonly logger = new Logger(PayslipMessagingService.name);

  constructor(
    private readonly payslips: PayslipRepository,
    private readonly payRuns: PayRunRepository,
    private readonly employees: PayrollEmployeeRepository,
    private readonly dispatcher: MessagingDispatcher,
    private readonly config: AppConfigService,
  ) {}

  /** Called after PayRunService.markPaid - one attempt per payslip in the run, each isolated so one failure never blocks the rest. */
  async sendForPayRun(tenantId: string, payRunId: string): Promise<void> {
    const payRun = await this.payRuns.findById(tenantId, payRunId);
    if (!payRun) {
      this.logger.error(`sendForPayRun: pay run "${payRunId}" not found`);
      return;
    }
    const payslips = await this.payslips.listByPayRun(tenantId, payRunId);
    for (const payslip of payslips) {
      try {
        await this.sendForPayslipRecord(tenantId, payslip, payRun.periodStart, payRun.payDate);
      } catch (error) {
        this.logger.error(`Failed to send payslip message for employee "${payslip.employeeId}"`, error as Error);
      }
    }
  }

  /** Manual resend for a single payslip - throws (rather than silently skipping) when the employee has no channel enabled or no usable phone, since this is an explicit admin action, not a best-effort batch. */
  async sendForPayslip(tenantId: string, payslipId: string): Promise<void> {
    const payslip = await this.payslips.findById(tenantId, payslipId);
    if (!payslip) {
      throw new NotFoundException(`Payslip "${payslipId}" not found`);
    }
    const payRun = await this.payRuns.findById(tenantId, payslip.payRunId);
    if (!payRun) {
      throw new NotFoundException(`Pay run "${payslip.payRunId}" not found`);
    }
    const employee = await this.employees.findById(tenantId, payslip.employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee "${payslip.employeeId}" not found`);
    }
    if (!employee.payslipSmsEnabled && !employee.payslipWhatsappEnabled) {
      throw new BadRequestException('This employee has neither SMS nor WhatsApp payslip delivery enabled');
    }
    if (!employee.phone || !isValidE164PhoneNumber(employee.phone)) {
      throw new BadRequestException('This employee has no valid E.164 phone number on file');
    }
    await this.dispatchToEmployee(employee, payslip, payRun.periodStart, payRun.payDate);
  }

  private async sendForPayslipRecord(
    tenantId: string,
    payslip: Payslip,
    periodStart: Date,
    payDate: Date,
  ): Promise<void> {
    const employee = await this.employees.findById(tenantId, payslip.employeeId);
    if (!employee || (!employee.payslipSmsEnabled && !employee.payslipWhatsappEnabled)) {
      return;
    }
    if (!employee.phone || !isValidE164PhoneNumber(employee.phone)) {
      this.logger.warn(`Employee "${employee.id}" has payslip messaging enabled but no valid phone - skipped`);
      return;
    }
    await this.dispatchToEmployee(employee, payslip, periodStart, payDate);
  }

  private async dispatchToEmployee(
    employee: PayrollEligibleEmployee,
    payslip: Payslip,
    periodStart: Date,
    payDate: Date,
  ): Promise<void> {
    // employee.phone/payslipSmsEnabled/payslipWhatsappEnabled are validated
    // non-null by both call sites above before this is reached.
    const phone = employee.phone as string;
    const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const paidLabel = payDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const gross = formatMoney(payslip.currency, payslip.grossPay);
    const net = formatMoney(payslip.currency, payslip.netPay);

    if (employee.payslipSmsEnabled) {
      const body = `Payslip for ${periodLabel}: Gross ${gross}, Net ${net}. Paid ${paidLabel}.`;
      const result = await this.dispatcher.sendSms(phone, body);
      if (!result.success) {
        this.logger.error(`SMS payslip send failed for employee "${employee.id}": ${result.error}`);
      }
    }

    if (employee.payslipWhatsappEnabled) {
      const templateSid = this.config.twilio.whatsappPayslipTemplateSid;
      if (!templateSid) {
        this.logger.warn(
          `Employee "${employee.id}" has WhatsApp payslip delivery enabled, but TWILIO_WHATSAPP_PAYSLIP_TEMPLATE_SID is not configured - skipped (no pre-approved template to send through)`,
        );
        return;
      }
      // Numbered keys match Twilio Content API's positional variable
      // convention ({{1}}, {{2}}, ...) - the actual mapping depends on
      // whichever template the business gets approved through Meta, so
      // this order (period, gross, net, paid date) must match that
      // template's own variable layout once one exists.
      const result = await this.dispatcher.sendWhatsApp(phone, templateSid, {
        '1': periodLabel,
        '2': gross,
        '3': net,
        '4': paidLabel,
      });
      if (!result.success) {
        this.logger.error(`WhatsApp payslip send failed for employee "${employee.id}": ${result.error}`);
      }
    }
  }
}
