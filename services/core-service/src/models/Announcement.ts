import { Schema, model, type InferSchemaType, Types } from 'mongoose';
import { ANNOUNCEMENT_CATEGORIES } from 'shared';

const announcementSchema = new Schema(
  {
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    // Set only for Nagarsevak-authored notices, scoped to their own ward. Null means
    // city-wide (the original Admin/Nagaradhyaksh behavior).
    ward: { type: Schema.Types.ObjectId, ref: 'Ward' },
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: { type: String, enum: ANNOUNCEMENT_CATEGORIES, default: 'general' },
    isEmergency: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

announcementSchema.index({ city: 1, status: 1, publishedAt: -1 });

export type Announcement = InferSchemaType<typeof announcementSchema> & { _id: Types.ObjectId };
export const AnnouncementModel = model('Announcement', announcementSchema);
