import type { Request, Response } from 'express';
import { NotificationModel } from '../models/Notification.js';

interface NotifyBody {
  recipients: { id: string; message: string }[];
  type: string;
  requestId?: string;
  announcementId?: string;
}

// Called only by core-service, over the docker/k8s internal network — not exposed publicly.
// Each recipient carries its own already-localized message (rendered server-side by
// core-service's notifyRecipients() per the recipient's stored language preference).
export async function handleNotify(req: Request, res: Response) {
  const body = req.body as NotifyBody;
  if (!Array.isArray(body.recipients) || body.recipients.length === 0 || !body.type) {
    res.status(400).json({ error: 'recipients and type are required' });
    return;
  }
  const docs = body.recipients.map(({ id, message }) => ({
    recipient: id,
    type: body.type,
    message,
    request: body.requestId,
    announcement: body.announcementId,
  }));
  await NotificationModel.insertMany(docs);
  res.status(201).json({ created: docs.length });
}
