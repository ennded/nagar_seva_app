import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../test/dbSetup.js';
import { NotificationModel } from '../models/Notification.js';
import { handleNotify } from './notify.js';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('handleNotify', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('rejects a request missing required fields', async () => {
    const res = mockRes();
    await handleNotify({ body: { recipientIds: [], type: 'new_request', message: 'x' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates one notification document per recipient', async () => {
    const recipientIds = [new Types.ObjectId().toString(), new Types.ObjectId().toString()];
    const requestId = new Types.ObjectId().toString();
    const res = mockRes();
    await handleNotify(
      { body: { recipientIds, type: 'new_request', message: 'New complaint registered', requestId } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(201);
    const docs = await NotificationModel.find({});
    expect(docs).toHaveLength(2);
    expect(docs.map((d) => String(d.recipient)).sort()).toEqual(recipientIds.sort());
    expect(docs[0].message).toBe('New complaint registered');
  });
});
