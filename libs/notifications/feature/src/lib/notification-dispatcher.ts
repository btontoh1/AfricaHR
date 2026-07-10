import { Injectable, Logger } from '@nestjs/common';

export interface DispatchResult {
  success: boolean;
  failureReason?: string;
}

/**
 * Abstract class (not an interface) so it doubles as a NestJS DI token —
 * the module provides LogNotificationDispatcher against it, and swapping in
 * a real SMTP/SendGrid/SES-backed implementation later needs only a
 * provider change, not a call-site change.
 */
@Injectable()
export abstract class NotificationDispatcher {
  abstract dispatchEmail(to: string, subject: string, body: string): Promise<DispatchResult>;
}

/**
 * PLACEHOLDER implementation — logs and reports success, sends nothing.
 * Every EMAIL-channel notification will show as SENT even though no real
 * message left the system. Must be replaced with a real provider (SendGrid,
 * SES, etc.) before any tenant relies on email delivery — same
 * clearly-flagged-placeholder convention as the Ghana PAYE/SSNIT seed data
 * (see project memory).
 */
@Injectable()
export class LogNotificationDispatcher extends NotificationDispatcher {
  private readonly logger = new Logger(LogNotificationDispatcher.name);

  async dispatchEmail(to: string, subject: string, body: string): Promise<DispatchResult> {
    this.logger.log(
      `[PLACEHOLDER EMAIL DISPATCH — no real provider configured] to=${to} subject="${subject}" body="${body}"`,
    );
    return { success: true };
  }
}
