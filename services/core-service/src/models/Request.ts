import { Schema, model, type InferSchemaType, Types } from 'mongoose';
import { REQUEST_TYPES, REQUEST_STATUSES, REQUEST_PRIORITIES } from 'shared';

const photoSchema = new Schema(
  {
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const resolutionProofSchema = new Schema(
  {
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const statusEventSchema = new Schema(
  {
    status: { type: String, enum: REQUEST_STATUSES, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false },
);

const baseOptions = {
  discriminatorKey: 'type',
  timestamps: true,
};

const requestSchema = new Schema(
  {
    type: { type: String, enum: REQUEST_TYPES, required: true },
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    citizen: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ward: { type: Schema.Types.ObjectId, ref: 'Ward', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    assignedOfficer: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: REQUEST_STATUSES, default: 'REGISTERED', index: true },
    priority: { type: String, enum: REQUEST_PRIORITIES, default: 'medium' },
    statusHistory: { type: [statusEventSchema], default: [] },
    adminReviewNote: { type: String },
    closedAt: { type: Date },
  },
  baseOptions,
);

requestSchema.index({ city: 1, status: 1, createdAt: -1 });
requestSchema.index({ ward: 1, status: 1 });
requestSchema.index({ assignedOfficer: 1, status: 1 });

export type RequestDoc = InferSchemaType<typeof requestSchema> & { _id: Types.ObjectId };
export const RequestModel = model('Request', requestSchema);

export const ComplaintModel = RequestModel.discriminator(
  'complaint',
  new Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    photos: { type: [photoSchema], default: [] },
    resolutionProof: { type: [resolutionProofSchema], default: [] },
    resolutionRemarks: { type: String },
  }),
);

export const AppointmentModel = RequestModel.discriminator(
  'appointment',
  new Schema({
    purpose: { type: String, required: true },
    remarks: { type: String },
    confirmedDate: { type: Date },
    confirmedTimeSlot: { type: String },
  }),
);
