import type { Request, Response } from 'express';
import { NotificationModel } from '../models/Notification.js';

interface NotifyBody {
  recipientIds: string[];
  type: string;
  message: string;
  requestId?: string;
  announcementId?: string;
}

// Called only by core-service, over the docker/k8s internal network — not exposed publicly.
export async function handleNotify(req: Request, res: Response) {
  const body = req.body as NotifyBody;
  if (!Array.isArray(body.recipientIds) || body.recipientIds.length === 0 || !body.type || !body.message) {
    res.status(400).json({ error: 'recipientIds, type, and message are required' });
    return;
  }
  const docs = body.recipientIds.map((recipient) => ({
    recipient,
    type: body.type,
    message: body.message,
    request: body.requestId,
    announcement: body.announcementId,
  }));
  await NotificationModel.insertMany(docs);
  res.status(201).json({ created: docs.length });
}
