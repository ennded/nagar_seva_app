import { AnnouncementModel } from '../../models/Announcement.js';
import { EmergencyContactModel } from '../../models/EmergencyContact.js';
import { UserModel } from '../../models/User.js';
import { requireRole, notFound, forbidden } from '../../auth/authorize.js';
import { mapAnnouncement, mapEmergencyContact, categoryFromGQL } from '../serialize.js';
import { notify } from '../../services/notificationClient.js';
import type { GraphQLContext } from '../../auth/context.js';

export const announcementResolvers = {
  Query: {
    announcementsAdmin: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin', 'nagaradhyaksh']);
      const docs = await AnnouncementModel.find({ city }).sort({ createdAt: -1 }).populate('ward');
      return docs.map(mapAnnouncement);
    },

    wardAnnouncements: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['nagarsevak']);
      if (!user.ward) return [];
      const docs = await AnnouncementModel.find({ ward: user.ward }).sort({ createdAt: -1 }).populate('ward');
      return docs.map(mapAnnouncement);
    },
  },
  Mutation: {
    createAnnouncement: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      const { city, user } = requireRole(ctx, ['admin', 'nagaradhyaksh', 'nagarsevak']);
      const category = input.category ? categoryFromGQL(input.category) : 'general';

      if (user.role === 'nagarsevak') {
        if (!user.ward) forbidden('You have no ward on file');
        const doc = await AnnouncementModel.create({
          city,
          ward: user.ward,
          title: input.title,
          body: input.body,
          category,
          createdBy: user._id,
          status: 'published',
          publishedAt: new Date(),
        });
        const wardCitizens = await UserModel.find({ city, ward: user.ward, role: 'citizen', isActive: true }).select('_id');
        await notify({
          recipientIds: wardCitizens.map((c) => String(c._id)),
          type: 'announcement_published',
          message: `New notice for your ward: ${doc.title}`,
          announcementId: String(doc._id),
        });
        return mapAnnouncement(await AnnouncementModel.findById(doc._id).populate('ward'));
      }

      const doc = await AnnouncementModel.create({
        city,
        title: input.title,
        body: input.body,
        category,
        // Only meaningful coming from the Nagaradhyaksh; Admin's own notices ignore it.
        isEmergency: user.role === 'nagaradhyaksh' ? Boolean(input.isEmergency) : false,
        createdBy: user._id,
      });
      return mapAnnouncement(doc);
    },

    deleteAnnouncement: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const { city, user } = requireRole(ctx, ['admin', 'nagaradhyaksh', 'nagarsevak']);
      const filter: Record<string, unknown> = { _id: id, city };
      // A Nagarsevak may only delete notices for their own ward, not city-wide ones.
      if (user.role === 'nagarsevak') filter.ward = user.ward;
      const result = await AnnouncementModel.deleteOne(filter);
      return result.deletedCount > 0;
    },

    publishAnnouncement: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin', 'nagaradhyaksh']);
      const doc = await AnnouncementModel.findOneAndUpdate(
        { _id: id, city },
        { status: 'published', publishedAt: new Date() },
        { new: true },
      );
      if (!doc) notFound('Announcement not found');

      const citizens = await UserModel.find({ city, role: 'citizen', isActive: true }).select('_id');
      await notify({
        recipientIds: citizens.map((c) => String(c._id)),
        type: 'announcement_published',
        message: `New notice: ${doc!.title}`,
        announcementId: String(doc!._id),
      });
      return mapAnnouncement(doc);
    },

    createEmergencyContact: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const doc = await EmergencyContactModel.create({
        city,
        name: input.name,
        category: categoryFromGQL(input.category),
        phoneNumber: input.phoneNumber,
        order: input.order ?? 0,
      });
      return mapEmergencyContact(doc);
    },

    updateEmergencyContact: async (_: unknown, { id, input }: { id: string; input: any }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const doc = await EmergencyContactModel.findOneAndUpdate(
        { _id: id, city },
        {
          name: input.name,
          category: categoryFromGQL(input.category),
          phoneNumber: input.phoneNumber,
          order: input.order ?? 0,
        },
        { new: true },
      );
      if (!doc) notFound('Emergency contact not found');
      return mapEmergencyContact(doc);
    },

    deleteEmergencyContact: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const result = await EmergencyContactModel.deleteOne({ _id: id, city });
      return result.deletedCount > 0;
    },
  },
};
