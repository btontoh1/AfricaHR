import { Injectable, Logger } from '@nestjs/common';

export interface MessageDispatchResult {
  success: boolean;
  error?: string;
}

/**
 * Best-effort outbound SMS/WhatsApp channel - distinct from
 * NotificationDispatcher (notifications/feature, EMAIL/IN_APP only,
 * User-centric) and from IAM's SmsDispatcher (MFA-only, one-off OTP codes).
 * This one is Employee-phone-centric: payroll's payslip delivery is the
 * first consumer, reaching workers who may have no User account at all
 * (e.g. kiosk-only hourly staff).
 *
 * WhatsApp cannot send free-form outbound text outside a 24-hour window
 * after the recipient last messaged the business - an outbound-initiated
 * message like "your payslip is ready" must use a pre-approved message
 * template (Twilio Content API / Meta template), identified here by
 * `templateContentSid`, with `variables` filling its placeholders.
 */
@Injectable()
export abstract class MessagingDispatcher {
  abstract sendSms(to: string, body: string): Promise<MessageDispatchResult>;
  abstract sendWhatsApp(
    to: string,
    templateContentSid: string,
    variables: Record<string, string>,
  ): Promise<MessageDispatchResult>;
}

/** No real provider configured - logs instead of sending, same posture as LogSmsDispatcher/LogNotificationDispatcher. */
@Injectable()
export class LogMessagingDispatcher extends MessagingDispatcher {
  private readonly logger = new Logger(LogMessagingDispatcher.name);

  async sendSms(to: string, body: string): Promise<MessageDispatchResult> {
    this.logger.log(`[PLACEHOLDER MESSAGING DISPATCH — no real provider configured] sms to=${to} body="${body}"`);
    return { success: true };
  }

  async sendWhatsApp(
    to: string,
    templateContentSid: string,
    variables: Record<string, string>,
  ): Promise<MessageDispatchResult> {
    this.logger.log(
      `[PLACEHOLDER MESSAGING DISPATCH — no real provider configured] whatsapp to=${to} template=${templateContentSid} variables=${JSON.stringify(variables)}`,
    );
    return { success: true };
  }
}
