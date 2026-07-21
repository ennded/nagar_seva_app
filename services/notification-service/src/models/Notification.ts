import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const NOTIFICATION_TYPES = [
  'new_request',
  'request_completed',
  'appointment_scheduled',
  'announcement_published',
] as const;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, required: true, index: true },
    request: { type: Schema.Types.ObjectId },
    announcement: { type: Schema.Types.ObjectId },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };
export const NotificationModel = model('Notification', notificationSchema);
