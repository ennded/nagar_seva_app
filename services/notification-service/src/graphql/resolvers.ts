import { GraphQLError } from 'graphql';
import { NotificationModel } from '../models/Notification.js';
import type { GraphQLContext } from './context.js';

function requireAuth(ctx: GraphQLContext) {
  if (!ctx.user) {
    throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return ctx.user;
}

export const resolvers = {
  Query: {
    myNotifications: async (_: unknown, args: { unreadOnly?: boolean }, ctx: GraphQLContext) => {
      const user = requireAuth(ctx);
      const filter: Record<string, unknown> = { recipient: user.sub };
      if (args.unreadOnly) filter.isRead = false;
      const docs = await NotificationModel.find(filter).sort({ createdAt: -1 }).limit(200);
      return docs.map(toGraphQL);
    },
  },
  Mutation: {
    markNotificationRead: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const user = requireAuth(ctx);
      const doc = await NotificationModel.findOneAndUpdate(
        { _id: args.id, recipient: user.sub },
        { isRead: true },
        { new: true },
      );
      if (!doc) {
        throw new GraphQLError('Notification not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return toGraphQL(doc);
    },
  },
};

function toGraphQL(doc: InstanceType<typeof NotificationModel>) {
  return {
    id: String(doc._id),
    type: doc.type,
    message: doc.message,
    isRead: doc.isRead,
    requestId: doc.request ? String(doc.request) : null,
    announcementId: doc.announcement ? String(doc.announcement) : null,
    createdAt: (doc as any).createdAt.toISOString(),
  };
}
