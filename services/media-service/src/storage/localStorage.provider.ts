import { promises as fs } from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import type { StorageProvider } from './storage.interface.js';

const root = path.resolve(process.cwd(), env.uploadsDir);

export const localStorageProvider: StorageProvider = {
  async save(buffer, filename, subdir) {
    const dir = path.join(root, subdir);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);
    return { key: `${subdir}/${filename}`, url: `/uploads/${subdir}/${filename}` };
  },
};

export function absolutePathForKey(key: string): string {
  return path.join(root, key);
}
