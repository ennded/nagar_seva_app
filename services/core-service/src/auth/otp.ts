import bcrypt from 'bcryptjs';
import { OtpRequestModel } from '../models/OtpRequest.js';
import { smsProvider } from '../services/sms/index.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestOtp(mobile: string): Promise<void> {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 8);
  await OtpRequestModel.deleteMany({ mobile });
  await OtpRequestModel.create({
    mobile,
    codeHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
  await smsProvider.sendOtp(mobile, code);
}

export type VerifyOtpResult = 'ok' | 'not_found' | 'expired' | 'too_many_attempts' | 'wrong_code';

export async function verifyOtp(mobile: string, code: string): Promise<VerifyOtpResult> {
  const otp = await OtpRequestModel.findOne({ mobile }).sort({ createdAt: -1 });
  if (!otp) return 'not_found';
  if (otp.expiresAt.getTime() < Date.now()) {
    await OtpRequestModel.deleteOne({ _id: otp._id });
    return 'expired';
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    await OtpRequestModel.deleteOne({ _id: otp._id });
    return 'too_many_attempts';
  }
  const matches = await bcrypt.compare(code, otp.codeHash);
  if (!matches) {
    otp.attempts += 1;
    await otp.save();
    return 'wrong_code';
  }
  await OtpRequestModel.deleteOne({ _id: otp._id });
  return 'ok';
}
