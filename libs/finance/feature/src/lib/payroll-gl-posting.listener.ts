import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FinanceService } from './finance.service';

/**
 * Consumes the event PayRunService emits after a pay run is marked paid and
 * disbursement has been kicked off. Lives here, not in payroll-feature,
 * because scope:payroll is not allowed to depend on scope:finance (see
 * eslint.config.mjs module boundaries) - this listener is the other half of
 * that decoupling, same pattern as notifications-feature's own payroll
 * listeners. The event name and payload shape below must match
 * libs/payroll/feature/src/lib/pay-run.service.ts's PAY_RUN_DISBURSED_EVENT
 * literally - there's no shared type to enforce it at compile time across
 * the boundary.
 */
export interface PayRunDisbursedEventPayload {
  tenantId: string;
  organizationId: string;
  payRunId: string;
  /** ISO date (YYYY-MM-DD), the pay run's payDate. */
  payDate: string;
  totalGrossPay: number;
  totalEmployerOnlyCost: number;
  totalNetPay: number;
}

@Injectable()
export class PayrollGlPostingListener {
  private readonly logger = new Logger(PayrollGlPostingListener.name);

  constructor(private readonly finance: FinanceService) {}

  @OnEvent('payroll.pay_run.disbursed')
  async handlePayRunDisbursed(payload: PayRunDisbursedEventPayload): Promise<void> {
    try {
      await this.finance.postPayrollDisbursement(payload.tenantId, {
        organizationId: payload.organizationId,
        payRunId: payload.payRunId,
        payDate: new Date(payload.payDate),
        totals: {
          totalGrossPay: payload.totalGrossPay,
          totalEmployerOnlyCost: payload.totalEmployerOnlyCost,
          totalNetPay: payload.totalNetPay,
        },
      });
    } catch (error) {
      // Best-effort side effect, same posture as every notification
      // listener - a GL posting failure must never surface back into (or
      // roll back) the payroll flow that already committed.
      this.logger.error(
        `Failed to post GL entry for disbursed pay run "${payload.payRunId}"`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
