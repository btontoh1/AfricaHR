import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';

/**
 * Consumes the event UserService.impersonateForTenant emits once an
 * impersonation session is actually issued. Lives here, not iam-feature,
 * because scope:iam is not allowed to depend on scope:notifications (see
 * eslint.config.mjs module boundaries) - this listener is the other half
 * of that decoupling, so the event name below must match
 * libs/iam/feature/src/lib/user.service.ts's IMPERSONATION_STARTED_EVENT
 * literally; there's no shared type to enforce it at compile time across
 * the boundary.
 *
 * This is deliberately never skippable or batched: every impersonation
 * session tells the person whose account it is, every time, in-app and by
 * email, so the capability stays a disclosed one rather than a silent one
 * (see UserService.impersonateForTenant's own doc comment).
 */
export interface ImpersonationStartedEventPayload {
  tenantId: string;
  targetUserId: string;
  actingAdminId: string;
  reason: string;
}

@Injectable()
export class ImpersonationNotificationListener {
  private readonly logger = new Logger(ImpersonationNotificationListener.name);

  constructor(private readonly notifications: NotificationService) {}

  @OnEvent('iam.user.impersonation_started')
  async handleImpersonationStarted(payload: ImpersonationStartedEventPayload): Promise<void> {
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const subject = 'Account access notice';
    const body = `A ParotHR support engineer accessed your account on ${date} for: ${payload.reason}. If this doesn't look right to you, contact support@parothr.com.`;

    for (const channel of ['IN_APP', 'EMAIL'] as const) {
      try {
        await this.notifications.send(
          payload.tenantId,
          { userId: payload.targetUserId, channel, subject, body },
          payload.actingAdminId,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send impersonation notice (${channel}) to user "${payload.targetUserId}"`,
          error as Error,
        );
      }
    }
  }
}
