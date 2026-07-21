import type { Request, Response } from 'express';
import { userFromRequest } from '../auth/jwt.js';
import { absolutePathForKey } from '../storage/localStorage.provider.js';

// GET /api/kyc/kyc/<filename> — admin-only. Not mounted under express.static, so this
// handler is the only path to these files; it checks the caller's role from the JWT
// core-service issued (media-service has no User model of its own to re-verify against).
export function handleKycRetrieval(req: Request, res: Response) {
  const user = userFromRequest(req);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admin authentication required' });
    return;
  }
  // req.params[0] is the wildcard match for "/api/kyc/*", e.g. "kyc/<filename>" —
  // this already matches the key format storageProvider.save() returns, no extra prefix needed.
  const key = req.params[0];
  if (!key || key.includes('..')) {
    res.status(400).json({ error: 'Invalid key' });
    return;
  }
  res.sendFile(absolutePathForKey(key), (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
}
