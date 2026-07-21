import type { SmsProvider } from './sms.interface.js';

// Local/dev provider: logs the OTP instead of sending a real SMS. Swap SMS_PROVIDER
// to a real gateway (MSG91/Twilio) implementation before production.
export const consoleSmsProvider: SmsProvider = {
  async sendOtp(mobile, code) {
    console.log(`[OTP] mobile=${mobile} code=${code} (console SMS provider — no real SMS sent)`);
  },
};
