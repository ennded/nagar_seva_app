import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.CORE_SERVICE_PORT ?? 4001),
  mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/nagar_seva'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  notificationInternalUrl: required('NOTIFICATION_INTERNAL_URL', 'http://localhost:4002/internal'),
  smsProvider: process.env.SMS_PROVIDER ?? 'console',
};
