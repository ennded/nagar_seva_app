import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const wardSchema = new Schema(
  {
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    nagarsevak: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

wardSchema.index({ city: 1, code: 1 }, { unique: true });

export type Ward = InferSchemaType<typeof wardSchema> & { _id: Types.ObjectId };
export const WardModel = model('Ward', wardSchema);
