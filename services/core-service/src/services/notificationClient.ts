import { env } from '../config/env.js';

export interface NotifyPayload {
  recipientIds: string[];
  type: 'new_request' | 'request_completed' | 'appointment_scheduled' | 'announcement_published';
  message: string;
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
