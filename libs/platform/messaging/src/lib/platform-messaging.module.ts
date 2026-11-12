import { Module } from '@nestjs/common';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
import { LogMessagingDispatcher, MessagingDispatcher } from './messaging-dispatcher';
import { TwilioMessagingDispatcher } from './twilio-messaging-dispatcher';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: MessagingDispatcher,
      inject: [AppConfigService],
      // Real Twilio client only when accountSid/authToken/smsFrom are all
      // set - falls back to the log stub otherwise (local/dev/CI), same
      // posture as notifications' SendGridNotificationDispatcher swap.
      // whatsappFrom is optional even for the real client: an SMS-only
      // Twilio account is a valid configuration, WhatsApp sends just fail
      // per-attempt with a clear error in that case (see
      // TwilioMessagingDispatcher.sendWhatsApp).
      useFactory: (config: AppConfigService) => {
        const { accountSid, authToken, smsFrom, whatsappFrom } = config.twilio;
        if (accountSid && authToken && smsFrom) {
          return new TwilioMessagingDispatcher(accountSid, authToken, smsFrom, whatsappFrom);
        }
        if (accountSid || authToken || smsFrom) {
          throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_SMS_FROM must all be set together to enable real SMS/WhatsApp delivery');
        }
        return new LogMessagingDispatcher();
      },
    },
  ],
  exports: [MessagingDispatcher],
})
export class PlatformMessagingModule {}
