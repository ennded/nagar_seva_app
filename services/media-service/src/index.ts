import express from 'express';
import cors from 'cors';
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

app.listen(env.port, () => {
  console.log(`media-service listening on :${env.port}`);
});
