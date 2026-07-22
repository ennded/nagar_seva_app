import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from './jwt.js';

describe('jwt', () => {
  it('round-trips a payload through sign and verify', () => {
    const token = signToken({ sub: 'user-1', role: 'admin', city: 'city-1' });
    const payload = verifyToken(token);
    expect(payload).toMatchObject({ sub: 'user-1', role: 'admin', city: 'city-1' });
  });

  it('returns null for a malformed token', () => {
    expect(verifyToken('not-a-real-token')).toBeNull();
  });

  it('returns null for a token signed with a different secret', () => {
    // Simulates a forged/tampered token — verifyToken must not trust it.
    const forged = jwt.sign({ sub: 'user-1', role: 'admin', city: 'city-1' }, 'wrong-secret');
    expect(verifyToken(forged)).toBeNull();
  });
});
