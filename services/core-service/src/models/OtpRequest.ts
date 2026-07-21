import { Schema, model, type InferSchemaType } from 'mongoose';

const otpRequestSchema = new Schema(
  {
    mobile: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ['login'], default: 'login' },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index: Mongo auto-deletes the document once expiresAt passes.
otpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpRequest = InferSchemaType<typeof otpRequestSchema>;
export const OtpRequestModel = model('OtpRequest', otpRequestSchema);
