import { env } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { buildNotificationMessage, type NotifyParams, type NotifyType } from './notificationMessages.js';

export interface NotifyPayload {
  recipients: { id: string; message: string }[];
  type: NotifyType;
  requestId?: string;
  announcementId?: string;
}

/**
 * Calls notification-service's internal fan-out endpoint. Synchronous HTTP for Phase 1
 * (traffic is low); a message queue is a reasonable resilience upgrade later, not needed now.
 */
export async function notify(payload: NotifyPayload): Promise<void> {
  try {
    const res = await fetch(`${env.notificationInternalUrl}/notify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`notification-service returned ${res.status} for payload`, payload);
    }
  } catch (err) {
    // Notification delivery failure must never break the citizen-facing mutation that triggered it.
    console.error('Failed to reach notification-service', err);
  }
}

/**
 * Looks up each recipient's stored language preference and renders the message text for them
 * individually before fanning out — the single place request.service.ts / announcement
 * resolvers need to call instead of building an English string themselves.
 */
export async function notifyRecipients(
  recipientIds: string[],
  type: NotifyType,
  params: NotifyParams,
  extra?: { requestId?: string; announcementId?: string },
): Promise<void> {
  if (recipientIds.length === 0) return;
  const users = await UserModel.find({ _id: { $in: recipientIds } }).select('language');
  const recipients = users.map((u) => ({
    id: String(u._id),
    message: buildNotificationMessage(type, (u.language as any) ?? 'en', params),
  }));
  await notify({ recipients, type, ...extra });
}
