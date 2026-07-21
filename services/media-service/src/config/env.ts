import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.MEDIA_SERVICE_PORT ?? 4003),
  jwtSecret: required('JWT_SECRET'),
  storageProvider: process.env.STORAGE_PROVIDER ?? 'local',
  uploadsDir: process.env.UPLOADS_DIR ?? 'uploads',
};
