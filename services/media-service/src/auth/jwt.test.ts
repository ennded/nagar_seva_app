import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken, userFromRequest } from './jwt.js';
import { env } from '../config/env.js';

describe('media-service jwt', () => {
  it('round-trips a payload signed with the shared secret', () => {
    const token = jwt.sign({ sub: 'user-1', role: 'admin', city: 'city-1' }, env.jwtSecret);
    expect(verifyToken(token)).toMatchObject({ sub: 'user-1', role: 'admin', city: 'city-1' });
  });

  it('returns null for a token signed with a different secret', () => {
    const forged = jwt.sign({ sub: 'user-1', role: 'admin', city: 'city-1' }, 'wrong-secret');
    expect(verifyToken(forged)).toBeNull();
  });

  describe('userFromRequest', () => {
    it('returns null when there is no Authorization header', () => {
      expect(userFromRequest({ headers: {} })).toBeNull();
    });

    it('returns null when the header is not a Bearer token', () => {
      expect(userFromRequest({ headers: { authorization: 'Basic abc123' } })).toBeNull();
    });

    it('extracts the payload from a valid Bearer token', () => {
      const token = jwt.sign({ sub: 'user-2', role: 'officer', city: 'city-1' }, env.jwtSecret);
      expect(userFromRequest({ headers: { authorization: `Bearer ${token}` } })).toMatchObject({ sub: 'user-2' });
    });
  });
});
