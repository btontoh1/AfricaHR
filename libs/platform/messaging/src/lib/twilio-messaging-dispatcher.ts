import { Logger } from '@nestjs/common';
import Twilio = require('twilio');
import { MessageDispatchResult, MessagingDispatcher } from './messaging-dispatcher';

export class TwilioMessagingDispatcher extends MessagingDispatcher {
  private readonly logger = new Logger(TwilioMessagingDispatcher.name);
  private readonly client: Twilio.Twilio;

  constructor(
    accountSid: string,
    authToken: string,
    private readonly smsFrom: string,
    private readonly whatsappFrom?: string,
  ) {
    super();
    this.client = Twilio(accountSid, authToken);
  }

  async sendSms(to: string, body: string): Promise<MessageDispatchResult> {
    try {
      await this.client.messages.create({ from: this.smsFrom, to, body });
      return { success: true };
    } catch (error) {
      this.logger.error(`SMS send failed to=${to}: ${error instanceof Error ? error.message : error}`);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown SMS send error' };
    }
  }

  /**
   * WhatsApp has no free-form outbound send outside a 24-hour window after
   * the recipient last messaged the business - this always goes through a
   * pre-approved Content API template (templateContentSid), never raw text.
   */
  async sendWhatsApp(
    to: string,
    templateContentSid: string,
    variables: Record<string, string>,
  ): Promise<MessageDispatchResult> {
    if (!this.whatsappFrom) {
      return { success: false, error: 'TWILIO_WHATSAPP_FROM is not configured' };
    }
    try {
      await this.client.messages.create({
        from: `whatsapp:${this.whatsappFrom}`,
        to: `whatsapp:${to}`,
        contentSid: templateContentSid,
        contentVariables: JSON.stringify(variables),
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`WhatsApp send failed to=${to}: ${error instanceof Error ? error.message : error}`);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown WhatsApp send error' };
    }
  }
}
