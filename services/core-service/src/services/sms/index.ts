import { env } from '../../config/env.js';
import type { SmsProvider } from './sms.interface.js';
import { consoleSmsProvider } from './consoleSms.provider.js';

// Only "console" is implemented for Phase 1; real providers (msg91/twilio) plug in here later
// behind the same SmsProvider interface without touching any calling code.
const providers: Record<string, SmsProvider> = {
  console: consoleSmsProvider,
};

export const smsProvider: SmsProvider = providers[env.smsProvider] ?? consoleSmsProvider;
