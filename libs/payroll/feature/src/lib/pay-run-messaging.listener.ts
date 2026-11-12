import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PayRunDisbursedEvent } from './pay-run.service';
import { PayslipMessagingService } from './payslip-messaging.service';

/**
 * Consumes the same PAY_RUN_DISBURSED_EVENT as finance's
 * PayrollGlPostingListener, but lives in payroll-feature itself (not a
 * cross-module listener) since this event is emitted here too - no Nx
 * boundary to route around for this one consumer.
 */
@Injectable()
export class PayRunMessagingListener {
  private readonly logger = new Logger(PayRunMessagingListener.name);

  constructor(private readonly messaging: PayslipMessagingService) {}

  @OnEvent('payroll.pay_run.disbursed')
  async handlePayRunDisbursed(payload: PayRunDisbursedEvent): Promise<void> {
    try {
      await this.messaging.sendForPayRun(payload.tenantId, payload.payRunId);
    } catch (error) {
      this.logger.error(`Failed to send payslip messages for pay run "${payload.payRunId}"`, error as Error);
    }
  }
}
