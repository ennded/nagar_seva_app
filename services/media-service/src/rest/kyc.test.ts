import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { handleKycRetrieval } from './kyc.js';
import { env } from '../config/env.js';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.sendFile = vi.fn();
  return res;
}

function adminToken() {
  return jwt.sign({ sub: 'admin-1', role: 'admin', city: 'city-1' }, env.jwtSecret);
}

describe('handleKycRetrieval', () => {
  it('rejects a request with no auth header', () => {
    const res = mockRes();
    handleKycRetrieval({ headers: {}, params: { 0: 'kyc/file.jpg' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('rejects a non-admin caller (e.g. an officer)', () => {
    const token = jwt.sign({ sub: 'officer-1', role: 'officer', city: 'city-1' }, env.jwtSecret);
    const res = mockRes();
    handleKycRetrieval(
      { headers: { authorization: `Bearer ${token}` }, params: { 0: 'kyc/file.jpg' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('rejects a path-traversal attempt in the key', () => {
    const res = mockRes();
    handleKycRetrieval(
      { headers: { authorization: `Bearer ${adminToken()}` }, params: { 0: '../../etc/passwd' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('rejects an empty key', () => {
    const res = mockRes();
    handleKycRetrieval({ headers: { authorization: `Bearer ${adminToken()}` }, params: { 0: '' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('serves the file for a valid admin request with a clean key', () => {
    const res = mockRes();
    handleKycRetrieval(
      { headers: { authorization: `Bearer ${adminToken()}` }, params: { 0: 'kyc/genuine-file.jpg' } } as any,
      res,
    );
    expect(res.sendFile).toHaveBeenCalledTimes(1);
    const [absolutePath] = res.sendFile.mock.calls[0];
    expect(absolutePath).toMatch(/kyc[\\/]genuine-file\.jpg$/);
  });
});
