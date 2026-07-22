import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../test/dbSetup.js';
import { NotificationModel } from '../models/Notification.js';
import { resolvers } from './resolvers.js';
import type { GraphQLContext } from './context.js';

describe('notification resolvers', () => {
  const userId = new Types.ObjectId().toString();
  const otherUserId = new Types.ObjectId().toString();
  const ctxFor = (sub: string): GraphQLContext => ({ user: { sub, role: 'citizen', city: 'city-1' } as any });
  const anonCtx: GraphQLContext = { user: null };

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('myNotifications', () => {
    it('rejects an unauthenticated caller', async () => {
      await expect(resolvers.Query.myNotifications(null, {}, anonCtx)).rejects.toThrow(/authentication/i);
    });

    it('only returns notifications addressed to the caller', async () => {
      await NotificationModel.create([
        { recipient: userId, type: 'new_request', message: 'Mine', isRead: false },
        { recipient: otherUserId, type: 'new_request', message: 'Not mine', isRead: false },
      ]);
      const result = await resolvers.Query.myNotifications(null, {}, ctxFor(userId));
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Mine');
    });

    it('filters to unread only when requested', async () => {
      await NotificationModel.create([
        { recipient: userId, type: 'new_request', message: 'Read one', isRead: true },
        { recipient: userId, type: 'new_request', message: 'Unread one', isRead: false },
      ]);
      const result = await resolvers.Query.myNotifications(null, { unreadOnly: true }, ctxFor(userId));
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Unread one');
    });
  });

  describe('markNotificationRead', () => {
    it('rejects an unauthenticated caller', async () => {
      await expect(resolvers.Mutation.markNotificationRead(null, { id: 'x' }, anonCtx)).rejects.toThrow(
        /authentication/i,
      );
    });

    it('marks the caller’s own notification as read', async () => {
      const doc = await NotificationModel.create({ recipient: userId, type: 'new_request', message: 'Hi', isRead: false });
      const result = await resolvers.Mutation.markNotificationRead(null, { id: String(doc._id) }, ctxFor(userId));
      expect(result.isRead).toBe(true);
    });

    it('refuses to mark another user’s notification as read', async () => {
      const doc = await NotificationModel.create({ recipient: otherUserId, type: 'new_request', message: 'Hi', isRead: false });
      await expect(
        resolvers.Mutation.markNotificationRead(null, { id: String(doc._id) }, ctxFor(userId)),
      ).rejects.toThrow(/not found/i);
    });
  });
});
