import { Injectable, Logger } from '@nestjs/common';
// @sendgrid/mail is a CommonJS `export =` module; this workspace doesn't
// enable esModuleInterop, so a default import isn't valid TS here - the
// `= require(...)` form is the interop-safe way to import it either way.
import sgMail = require('@sendgrid/mail');

export interface DispatchResult {
  success: boolean;
  failureReason?: string;
}

/**
 * Abstract class (not an interface) so it doubles as a NestJS DI token —
 * the module provides either LogNotificationDispatcher or
 * SendGridNotificationDispatcher against it depending on config, and any
 * future provider swap needs only a provider change, not a call-site
 * change.
 */
@Injectable()
export abstract class NotificationDispatcher {
  abstract dispatchEmail(to: string, subject: string, body: string): Promise<DispatchResult>;
}

/**
 * PLACEHOLDER implementation — logs and reports success, sends nothing.
 * Used when SENDGRID_API_KEY is unset (local/dev/CI), so those
 * environments never need a real provider credential to boot. See
 * NotificationsFeatureModule for the selection logic.
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

/**
 * Real email delivery via SendGrid. body is treated as plain text, not
 * HTML - templates are rendered by NotificationTemplateService with
 * `{{variable}}` substitution only, no HTML escaping, so passing it
 * through as `html` would be an XSS-shaped risk if a template ever
 * embedded user-controlled data.
 */
@Injectable()
export class SendGridNotificationDispatcher extends NotificationDispatcher {
  private readonly logger = new Logger(SendGridNotificationDispatcher.name);
  private readonly client: typeof sgMail;

  constructor(apiKey: string, private readonly fromEmail: string) {
    super();
    this.client = sgMail;
    this.client.setApiKey(apiKey);
  }

  async dispatchEmail(to: string, subject: string, body: string): Promise<DispatchResult> {
    try {
      await this.client.send({ to, from: this.fromEmail, subject, text: body });
      return { success: true };
    } catch (error) {
      const failureReason = error instanceof Error ? error.message : 'Unknown SendGrid error';
      this.logger.error(`Failed to send email to ${to}: ${failureReason}`);
      return { success: false, failureReason };
    }
  }
}
