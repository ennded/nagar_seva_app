import { Schema, model, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, KYC_STATUSES, type Role, type KycStatus } from 'shared';

export interface UserFields {
  name: string;
  mobile: string;
  email?: string;
  passwordHash?: string;
  role: Role;
  city: Types.ObjectId;
  ward?: Types.ObjectId;
  department?: Types.ObjectId;
  aadharDocUrl?: string;
  voterIdDocUrl?: string;
  kycStatus: KycStatus;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

type UserModelType = Model<UserFields, {}, UserMethods>;

const userSchema = new Schema<UserFields, UserModelType, UserMethods>(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ROLES, required: true, index: true },
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    ward: { type: Schema.Types.ObjectId, ref: 'Ward' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    aadharDocUrl: { type: String },
    voterIdDocUrl: { type: String },
    kycStatus: { type: String, enum: KYC_STATUSES, default: 'pending' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Exactly one Nagaradhyaksh per city.
userSchema.index(
  { role: 1, city: 1 },
  { unique: true, partialFilterExpression: { role: 'nagaradhyaksh' } },
);
userSchema.index({ city: 1, role: 1 });

userSchema.pre('validate', function preValidate(next) {
  if (['citizen', 'nagarsevak'].includes(this.role) && !this.ward) {
    next(new Error(`ward is required for role "${this.role}"`));
    return;
  }
  if (this.role === 'officer' && !this.department) {
    next(new Error('department is required for role "officer"'));
    return;
  }
  next();
});

userSchema.pre('save', async function preSave(next) {
  if (this.isModified('passwordHash') && this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 11);
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate: string): Promise<boolean> {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

export type User = UserFields & { _id: Types.ObjectId } & UserMethods;
export const UserModel = model<UserFields, UserModelType>('User', userSchema);
