import { Schema, model, type InferSchemaType } from 'mongoose';

const citySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String },
    address: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    aboutText: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type City = InferSchemaType<typeof citySchema>;
export const CityModel = model('City', citySchema);
