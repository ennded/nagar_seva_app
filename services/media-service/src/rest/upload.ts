import multer from 'multer';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { storageProvider } from '../storage/index.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, or WEBP images are allowed'));
      return;
    }
    cb(null, true);
  },
});

async function handleUpload(req: Request, res: Response, subdir: string) {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded (field name must be "file")' });
    return;
  }
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${uuidv4()}${ext}`;
  const saved = await storageProvider.save(file.buffer, filename, subdir);
  res.status(201).json(saved);
}

export const handleComplaintPhotoUpload = (req: Request, res: Response) => handleUpload(req, res, 'complaints');

// KYC docs are saved but never statically served publicly — the "url" returned here
// points at the protected /api/kyc/:key retrieval route (admin JWT required), not a raw static path.
export async function handleKycDocumentUpload(req: Request, res: Response) {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded (field name must be "file")' });
    return;
  }
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${uuidv4()}${ext}`;
  const saved = await storageProvider.save(file.buffer, filename, 'kyc');
  res.status(201).json({ key: saved.key, url: `/api/kyc/${saved.key}` });
}
