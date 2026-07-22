import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../test/dbSetup.js';
import { OtpRequestModel } from '../models/OtpRequest.js';
import { requestOtp, verifyOtp } from './otp.js';

// Capture the plaintext code the console SMS provider would "send", so tests can drive the
// real verifyOtp acceptance path — the DB only ever stores a bcrypt hash of it. vi.mock calls
// are hoisted above imports, so otp.ts's own import of smsProvider resolves to this mock.
let lastSentCode = '';
vi.mock('../services/sms/index.js', () => ({
  smsProvider: {
    sendOtp: vi.fn(async (_mobile: string, code: string) => {
      lastSentCode = code;
    }),
  },
}));

describe('otp', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('returns not_found when no OTP was ever requested for a mobile number', async () => {
    expect(await verifyOtp('9000000001', '123456')).toBe('not_found');
  });

  it('rejects a wrong code without invalidating the correct one', async () => {
    await requestOtp('9000000002');
    expect(await verifyOtp('9000000002', '000000')).toBe('wrong_code');
    // A wrong guess must not invalidate the legitimate code — it should still verify.
    expect(await verifyOtp('9000000002', lastSentCode)).toBe('ok');
  });

  it('accepts the correct code exactly once, and rejects reuse', async () => {
    await requestOtp('9000000003');
    expect(await verifyOtp('9000000003', lastSentCode)).toBe('ok');
    // The record is consumed on success — verifying the same code again finds nothing.
    expect(await verifyOtp('9000000003', lastSentCode)).toBe('not_found');
  });

  it('expires an OTP past its TTL', async () => {
    await requestOtp('9000000004');
    await OtpRequestModel.updateOne({ mobile: '9000000004' }, { expiresAt: new Date(Date.now() - 1000) });
    expect(await verifyOtp('9000000004', '123456')).toBe('expired');
    expect(await OtpRequestModel.findOne({ mobile: '9000000004' })).toBeNull();
  });

  it('locks out after too many wrong attempts', async () => {
    await requestOtp('9000000005');
    for (let i = 0; i < 5; i += 1) {
      await verifyOtp('9000000005', 'wrong-code');
    }
    expect(await verifyOtp('9000000005', 'wrong-code')).toBe('too_many_attempts');
  });

  it('requesting a new OTP invalidates the previous one for that mobile', async () => {
    await requestOtp('9000000006');
    const first = await OtpRequestModel.findOne({ mobile: '9000000006' });
    await requestOtp('9000000006');
    const all = await OtpRequestModel.find({ mobile: '9000000006' });
    expect(all).toHaveLength(1);
    expect(String(all[0]._id)).not.toBe(String(first!._id));
  });
});
