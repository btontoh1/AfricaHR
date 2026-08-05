import { Injectable, Logger } from '@nestjs/common';

export interface SmsDispatchResult {
  success: boolean;
  failureReason?: string;
}

/**
 * Abstract class (not an interface) so it doubles as a NestJS DI token -
 * same pattern as NotificationDispatcher in notifications-feature. Only
 * MfaService consumes this today (phone-based MFA), so it lives here
 * rather than as a general notification channel - build a real
 * NotificationDispatcher-style SMS channel separately if that's ever
 * needed too.
 */
@Injectable()
export abstract class SmsDispatcher {
  abstract sendSms(to: string, body: string): Promise<SmsDispatchResult>;
}

/**
 * PLACEHOLDER implementation - logs and reports success, sends nothing.
 * No real SMS provider is wired up yet (see IamFeatureModule) - swap in a
 * real client (Twilio, Africa's Talking, Termii, ...) by implementing
 * SmsDispatcher and changing the provider registration, same as
 * NotificationDispatcher's SendGrid swap.
 */
@Injectable()
export class LogSmsDispatcher extends SmsDispatcher {
  private readonly logger = new Logger(LogSmsDispatcher.name);

  async sendSms(to: string, body: string): Promise<SmsDispatchResult> {
    this.logger.log(`[PLACEHOLDER SMS DISPATCH — no real provider configured] to=${to} body="${body}"`);
    return { success: true };
  }
}
