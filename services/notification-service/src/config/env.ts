import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.NOTIFICATION_SERVICE_PORT ?? 4002),
  mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/nagar_seva'),
  jwtSecret: required('JWT_SECRET'),
};
