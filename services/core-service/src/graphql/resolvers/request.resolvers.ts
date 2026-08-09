import { Types } from 'mongoose';
import { RequestModel, ComplaintModel, AppointmentModel } from '../../models/Request.js';
import { UserModel } from '../../models/User.js';
import { DepartmentModel } from '../../models/Department.js';
import { WardModel } from '../../models/Ward.js';
import { requireRole, notFound } from '../../auth/authorize.js';
import { mapRequest, mapUser } from '../serialize.js';
import * as requestService from '../../services/request.service.js';
import type { GraphQLContext } from '../../auth/context.js';

// After .populate(), a ref field is a full document (not a raw ObjectId) — String(doc) doesn't
// yield the _id hex string, so comparisons must unwrap ._id first. Works for populated docs,
// raw ObjectIds, and plain id strings alike.
function idOf(ref: any): string {
  return String(ref?._id ?? ref);
}

function applyPopulate(query: any) {
  return query
    .populate('citizen')
    .populate('ward')
    .populate('department')
    .populate('assignedOfficer')
    .populate('statusHistory.changedBy')
    .populate('resolutionProof.uploadedBy');
}

export const requestResolvers = {
  Query: {
    officersByDepartment: async (_: unknown, { departmentId }: { departmentId: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin', 'citizen']);
      const officers = await UserModel.find({ department: departmentId, city, role: 'officer', isActive: true }).populate(
        'department',
      );
      return officers.map(mapUser);
    },

    myRequests: async (_: unknown, { status }: { status?: string }, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['citizen']);
      const filter: Record<string, unknown> = { citizen: user._id };
      if (status) filter.status = status;
      const docs = await applyPopulate(RequestModel.find(filter).sort({ createdAt: -1 }));
      return docs.map(mapRequest);
    },

    request: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const { user, city } = requireRole(ctx, ['citizen', 'admin', 'officer', 'nagarsevak', 'nagaradhyaksh']);
      const doc = await applyPopulate(RequestModel.findOne({ _id: id, city }));
      if (!doc) return null;
      if (user.role === 'citizen' && idOf(doc.citizen) !== idOf(user._id)) notFound('Request not found');
      if (user.role === 'officer' && idOf(doc.assignedOfficer) !== idOf(user._id)) notFound('Request not found');
      if (user.role === 'nagarsevak' && idOf(doc.ward) !== idOf(user.ward)) notFound('Request not found');
      return mapRequest(doc);
    },

    pendingRequests: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const docs = await applyPopulate(RequestModel.find({ city, status: 'REGISTERED' }).sort({ createdAt: 1 }));
      return docs.map(mapRequest);
    },

    allRequests: async (_: unknown, args: { filter?: any; page?: number; limit?: number }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      return paginatedRequests(city, args);
    },

    myAssignedRequests: async (_: unknown, { status }: { status?: string }, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['officer']);
      const filter: Record<string, unknown> = { assignedOfficer: user._id };
      if (status) filter.status = status;
      const docs = await applyPopulate(RequestModel.find(filter).sort({ createdAt: -1 }));
      return docs.map(mapRequest);
    },

    wardRequests: async (_: unknown, { status }: { status?: string }, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['nagarsevak']);
      const filter: Record<string, unknown> = { ward: user.ward };
      if (status) filter.status = status;
      const docs = await applyPopulate(RequestModel.find(filter).sort({ createdAt: -1 }));
      return docs.map(mapRequest);
    },

    municipalityRequests: async (_: unknown, args: { filter?: any; page?: number; limit?: number }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['nagaradhyaksh']);
      return paginatedRequests(city, args);
    },

    dashboardStats: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['nagaradhyaksh', 'admin']);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const [
        totalRequests,
        totalComplaints,
        openComplaints,
        resolvedToday,
        closedCount,
        pendingAppointments,
        completedAppointments,
        byStatusRaw,
        byDepartmentRaw,
        byWardRaw,
        byCategoryRaw,
        byPriorityRaw,
      ] = await Promise.all([
        RequestModel.countDocuments({ city }),
        RequestModel.countDocuments({ city, type: 'complaint' }),
        RequestModel.countDocuments({ city, type: 'complaint', status: { $nin: ['CLOSED', 'REJECTED'] } }),
        RequestModel.countDocuments({ city, status: 'CLOSED', closedAt: { $gte: startOfToday } }),
        RequestModel.countDocuments({ city, status: 'CLOSED' }),
        RequestModel.countDocuments({ city, type: 'appointment', status: { $nin: ['SCHEDULED', 'CLOSED', 'REJECTED'] } }),
        RequestModel.countDocuments({ city, type: 'appointment', status: 'CLOSED' }),
        RequestModel.aggregate([{ $match: { city } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        RequestModel.aggregate([
          { $match: { city, department: { $ne: null } } },
          { $group: { _id: '$department', count: { $sum: 1 } } },
        ]),
        RequestModel.aggregate([{ $match: { city } }, { $group: { _id: '$ward', count: { $sum: 1 } } }]),
        RequestModel.aggregate([
          { $match: { city, type: 'complaint' } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
        RequestModel.aggregate([{ $match: { city } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      ]);
      const [departments, wards] = await Promise.all([
        DepartmentModel.find({ _id: { $in: byDepartmentRaw.map((d) => d._id) } }),
        WardModel.find({ _id: { $in: byWardRaw.map((w) => w._id) } }),
      ]);
      return {
        totalRequests,
        totalComplaints,
        openComplaints,
        resolvedToday,
        resolutionRate: totalRequests > 0 ? Math.round((closedCount / totalRequests) * 100) : 0,
        pendingAppointments,
        completedAppointments,
        byStatus: byStatusRaw.map((s) => ({ status: s._id, count: s.count })),
        byDepartment: byDepartmentRaw.map((d) => ({
          department: departments.find((dep) => String(dep._id) === String(d._id)),
          count: d.count,
        })),
        byWard: byWardRaw.map((w) => ({
          ward: wards.find((wd) => String(wd._id) === String(w._id)),
          count: w.count,
        })),
        byCategory: byCategoryRaw.map((c) => ({ category: c._id, count: c.count })),
        byPriority: byPriorityRaw.map((p) => ({ priority: String(p._id ?? 'medium').toUpperCase(), count: p.count })),
      };
    },

    departmentPerformance: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { city, user } = requireRole(ctx, ['nagaradhyaksh', 'admin', 'nagarsevak']);
      const matchFilter: Record<string, unknown> = { city, department: { $ne: null } };
      // aggregate() bypasses Mongoose's query-casting, and ctx.user.ward is a populated
      // Ward document (not a raw ObjectId) — must unwrap ._id or the $match compares a
      // whole document against the stored ObjectId and silently matches nothing.
      if (user.role === 'nagarsevak') matchFilter.ward = new Types.ObjectId(idOf(user.ward));
      const raw = await RequestModel.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$department',
            totalRequests: { $sum: 1 },
            resolvedRequests: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
            avgResolutionDays: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'CLOSED'] },
                  { $divide: [{ $subtract: ['$closedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] },
                  null,
                ],
              },
            },
          },
        },
      ]);
      const departments = await DepartmentModel.find({ _id: { $in: raw.map((d) => d._id) } });
      return raw
        .map((d) => ({
          department: departments.find((dep) => String(dep._id) === String(d._id)),
          totalRequests: d.totalRequests,
          resolvedRequests: d.resolvedRequests,
          resolutionRate: d.totalRequests > 0 ? Math.round((d.resolvedRequests / d.totalRequests) * 100) : 0,
          avgResolutionDays: d.avgResolutionDays != null ? Math.round(d.avgResolutionDays * 10) / 10 : null,
        }))
        .sort((a, b) => (a.department?.name ?? '').localeCompare(b.department?.name ?? ''));
    },

    wardPerformance: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['nagaradhyaksh', 'admin']);
      const raw = await RequestModel.aggregate([
        { $match: { city, type: 'complaint' } },
        {
          $group: {
            _id: '$ward',
            totalComplaints: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $in: ['$status', ['CLOSED', 'REJECTED']] }, 0, 1] } },
            avgResolutionDays: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'CLOSED'] },
                  { $divide: [{ $subtract: ['$closedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] },
                  null,
                ],
              },
            },
          },
        },
      ]);
      const wards = await WardModel.find({ _id: { $in: raw.map((w) => w._id) } });
      return raw
        .map((w) => ({
          ward: wards.find((wd) => String(wd._id) === String(w._id)),
          totalComplaints: w.totalComplaints,
          pending: w.pending,
          resolutionRate: w.totalComplaints > 0 ? Math.round((w.resolved / w.totalComplaints) * 100) : 0,
          avgResolutionDays: w.avgResolutionDays != null ? Math.round(w.avgResolutionDays * 10) / 10 : null,
        }))
        .sort((a, b) => (a.ward?.name ?? '').localeCompare(b.ward?.name ?? ''));
    },
  },

  Mutation: {
    submitComplaint: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['citizen']);
      const doc = await requestService.submitComplaint(user as any, input);
      return mapRequest(await applyPopulate(RequestModel.findById(doc._id)));
    },

    submitAppointment: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['citizen']);
      const doc = await requestService.submitAppointment(user as any, input);
      return mapRequest(await applyPopulate(RequestModel.findById(doc._id)));
    },

    verifyRequest: async (
      _: unknown,
      { id, approve, note }: { id: string; approve: boolean; note?: string },
      ctx: GraphQLContext,
    ) => {
      const { user } = requireRole(ctx, ['admin']);
      const doc = await requestService.verifyRequest(user as any, id, approve, note);
      return mapRequest(await applyPopulate(RequestModel.findById(doc._id)));
    },

    assignRequest: async (
      _: unknown,
      { id, departmentId, officerId }: { id: string; departmentId: string; officerId: string },
      ctx: GraphQLContext,
    ) => {
      const { user } = requireRole(ctx, ['admin']);
      const doc = await requestService.assignRequest(user as any, id, departmentId, officerId);
      return mapRequest(await applyPopulate(RequestModel.findById(doc._id)));
    },

    reviewAndClose: async (_: unknown, { id, note }: { id: string; note?: string }, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['admin']);
      const doc = await requestService.reviewAndClose(user as any, id, note);
      return mapRequest(await applyPopulate(RequestModel.findById(doc._id)));
    },

    startWork: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['officer']);
      const doc = await requestService.startWork(user as any, id);
      return mapRequest(await applyPopulate(RequestModel.findById(doc._id)));
    },

    completeComplaint: async (
      _: unknown,
      { id, resolutionProofUrls, remarks }: { id: string; resolutionProofUrls: string[]; remarks?: string },
      ctx: GraphQLContext,
    ) => {
      const { user } = requireRole(ctx, ['officer']);
      const doc = await requestService.completeComplaint(user as any, id, resolutionProofUrls, remarks);
      return mapRequest(await applyPopulate(RequestModel.findById(doc._id)));
    },

    scheduleAppointment: async (
      _: unknown,
      { id, confirmedDate, confirmedTimeSlot }: { id: string; confirmedDate: string; confirmedTimeSlot: string },
      ctx: GraphQLContext,
    ) => {
      const { user } = requireRole(ctx, ['officer']);
      const doc = await requestService.scheduleAppointment(user as any, id, confirmedDate, confirmedTimeSlot);
      return mapRequest(await applyPopulate(RequestModel.findById(doc._id)));
    },

    updateMyAvailability: async (_: unknown, { slots }: { slots: any[] }, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['officer']);
      const updated = await UserModel.findByIdAndUpdate(user._id, { availability: slots }, { new: true })
        .populate('ward')
        .populate('department');
      return mapUser(updated);
    },

    setRequestPriority: async (_: unknown, { id, priority }: { id: string; priority: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const doc = await RequestModel.findOneAndUpdate({ _id: id, city }, { priority: priority.toLowerCase() }, { new: true });
      if (!doc) notFound('Request not found');
      return mapRequest(await applyPopulate(RequestModel.findById(doc!._id)));
    },
  },

  RequestUnion: {
    __resolveType: (obj: any) => obj.__typename,
  },
};

async function paginatedRequests(city: unknown, args: { filter?: any; page?: number; limit?: number }) {
  const page = args.page ?? 1;
  const limit = args.limit ?? 25;
  const filter: Record<string, unknown> = { city };
  if (args.filter?.type) filter.type = args.filter.type.toLowerCase();
  if (args.filter?.status) filter.status = args.filter.status;
  if (args.filter?.wardId) filter.ward = args.filter.wardId;
  if (args.filter?.departmentId) filter.department = args.filter.departmentId;

  const [items, total] = await Promise.all([
    applyPopulate(
      RequestModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    RequestModel.countDocuments(filter),
  ]);
  return { items: items.map(mapRequest), total, page, limit };
}
