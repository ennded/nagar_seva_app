import { Schema, model, type InferSchemaType, Types } from 'mongoose';
import { EMERGENCY_CONTACT_CATEGORIES } from 'shared';

const emergencyContactSchema = new Schema(
  {
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, enum: EMERGENCY_CONTACT_CATEGORIES, required: true },
    phoneNumber: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

emergencyContactSchema.index({ city: 1, order: 1 });

export type EmergencyContact = InferSchemaType<typeof emergencyContactSchema> & { _id: Types.ObjectId };
export const EmergencyContactModel = model('EmergencyContact', emergencyContactSchema);
