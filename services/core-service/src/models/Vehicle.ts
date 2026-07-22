import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const vehicleSchema = new Schema(
  {
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    ward: { type: Schema.Types.ObjectId, ref: 'Ward', required: true, index: true },
    registrationNumber: { type: String, required: true, trim: true },
    driver: { type: Schema.Types.ObjectId, ref: 'User' },
    onDuty: { type: Boolean, default: false },
    currentLat: { type: Number },
    currentLng: { type: Number },
    locationUpdatedAt: { type: Date },
  },
  { timestamps: true },
);

vehicleSchema.index({ city: 1, ward: 1 }, { unique: true });

export type Vehicle = InferSchemaType<typeof vehicleSchema> & { _id: Types.ObjectId };
export const VehicleModel = model('Vehicle', vehicleSchema);
