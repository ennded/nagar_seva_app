import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { env } from './config/env.js';
import { uploadMiddleware, handleComplaintPhotoUpload, handleKycDocumentUpload } from './rest/upload.js';
import { handleKycRetrieval } from './rest/kyc.js';

const app = express();
app.use(cors());

// Complaint/resolution-proof photos are plain public static files once uploaded.
app.use('/uploads/complaints', express.static(path.resolve(process.cwd(), env.uploadsDir, 'complaints')));

app.post('/api/upload/complaint-photo', uploadMiddleware.single('file'), handleComplaintPhotoUpload);
app.post('/api/upload/kyc-document', uploadMiddleware.single('file'), handleKycDocumentUpload);

// Admin-only protected retrieval — deliberately NOT under express.static.
app.get('/api/kyc/*', handleKycRetrieval);

app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Without this, a rejected upload (bad file type, too large) falls through to Express's
// default HTML error page instead of JSON — the client can't read `body.error` from that,
// so the failure looks like a silent no-op instead of showing the real reason.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError || err instanceof Error) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Upload failed' });
});

app.listen(env.port, () => {
  console.log(`media-service listening on :${env.port}`);
});
