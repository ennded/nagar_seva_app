import { env } from '../config/env.js';
import type { StorageProvider } from './storage.interface.js';
import { localStorageProvider } from './localStorage.provider.js';

// Only "local" is implemented for Phase 1; an S3/Cloudinary provider plugs in here later
// behind the same StorageProvider interface without touching any calling code.
const providers: Record<string, StorageProvider> = {
  local: localStorageProvider,
};

export const storageProvider: StorageProvider = providers[env.storageProvider] ?? localStorageProvider;
