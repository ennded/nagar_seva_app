import { afterAll, describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

// Isolate from the real dev uploads/ folder — env.uploadsDir is read once at import time,
// so this must be set before localStorage.provider.js (and its env.js import) is loaded.
process.env.UPLOADS_DIR = 'uploads-test-tmp';

const { localStorageProvider, absolutePathForKey } = await import('./localStorage.provider.js');

const testRoot = path.resolve(process.cwd(), 'uploads-test-tmp');

afterAll(async () => {
  await fs.rm(testRoot, { recursive: true, force: true });
});

describe('localStorageProvider', () => {
  it('writes the file to disk under the given subdir and returns a matching key/url', async () => {
    const buffer = Buffer.from('fake image bytes');
    const saved = await localStorageProvider.save(buffer, 'photo.jpg', 'complaints');

    expect(saved.key).toBe('complaints/photo.jpg');
    expect(saved.url).toBe('/uploads/complaints/photo.jpg');

    const written = await fs.readFile(path.join(testRoot, 'complaints', 'photo.jpg'));
    expect(written.equals(buffer)).toBe(true);
  });

  it('absolutePathForKey resolves a key back to the on-disk path', () => {
    const resolved = absolutePathForKey('complaints/photo.jpg');
    expect(resolved).toBe(path.join(testRoot, 'complaints', 'photo.jpg'));
  });
});
