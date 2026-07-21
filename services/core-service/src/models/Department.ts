import { Schema, model, type InferSchemaType, Types } from 'mongoose';

const departmentSchema = new Schema(
  {
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
  },
  { timestamps: true },
);

departmentSchema.index({ city: 1, name: 1 }, { unique: true });

export type Department = InferSchemaType<typeof departmentSchema> & { _id: Types.ObjectId };
export const DepartmentModel = model('Department', departmentSchema);
