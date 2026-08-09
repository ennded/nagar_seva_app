import { WardModel } from '../../models/Ward.js';
import { DepartmentModel } from '../../models/Department.js';
import { UserModel } from '../../models/User.js';
import { VehicleModel } from '../../models/Vehicle.js';
import { requireRole, badInput } from '../../auth/authorize.js';
import { mapWard, mapDepartment, mapUser, roleFromGQL } from '../serialize.js';
import type { GraphQLContext } from '../../auth/context.js';

export const adminSetupResolvers = {
  Query: {
    staffByCity: async (_: unknown, { role }: { role?: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      // Admin accounts aren't managed through this staff CRUD (not creatable here either) —
      // exclude them so there's no self-deactivate/self-delete footgun sitting in the list.
      const filter: Record<string, unknown> = role
        ? { city, role: roleFromGQL(role) }
        : { city, role: { $nin: ['citizen', 'admin'] } };
      const users = await UserModel.find(filter).sort({ role: 1, name: 1 }).populate('ward').populate('department');
      return users.map(mapUser);
    },

    // Like staffByCity, but includes citizens — backs the admin "Users" page, which manages
    // every account in the city (staff and citizens alike), not just staff.
    usersByCity: async (_: unknown, { role }: { role?: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const filter: Record<string, unknown> = role ? { city, role: roleFromGQL(role) } : { city, role: { $ne: 'admin' } };
      const users = await UserModel.find(filter).sort({ role: 1, name: 1 }).populate('ward').populate('department');
      return users.map(mapUser);
    },
  },
  Mutation: {
    createWard: async (_: unknown, { name, code }: { name: string; code: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const ward = await WardModel.create({ city, name, code });
      return mapWard(ward);
    },

    updateWard: async (
      _: unknown,
      { id, name, code }: { id: string; name?: string; code?: string },
      ctx: GraphQLContext,
    ) => {
      const { city } = requireRole(ctx, ['admin']);
      const ward = await WardModel.findOne({ _id: id, city });
      if (!ward) badInput('Ward not found');
      if (name) ward!.name = name;
      if (code) ward!.code = code;
      await ward!.save();
      return mapWard(ward);
    },

    deleteWard: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const ward = await WardModel.findOne({ _id: id, city });
      if (!ward) badInput('Ward not found');
      const usersInWard = await UserModel.countDocuments({ ward: id });
      if (usersInWard > 0) badInput('Cannot delete a ward with staff or citizens still assigned to it');
      const vehicleInWard = await VehicleModel.countDocuments({ ward: id });
      if (vehicleInWard > 0) badInput('Cannot delete a ward with a garbage vehicle still assigned to it');
      await WardModel.deleteOne({ _id: id });
      return true;
    },

    createDepartment: async (
      _: unknown,
      { name, description }: { name: string; description?: string },
      ctx: GraphQLContext,
    ) => {
      const { city } = requireRole(ctx, ['admin']);
      const department = await DepartmentModel.create({ city, name, description });
      return mapDepartment(department);
    },

    updateDepartment: async (
      _: unknown,
      { id, name, description }: { id: string; name?: string; description?: string },
      ctx: GraphQLContext,
    ) => {
      const { city } = requireRole(ctx, ['admin']);
      const department = await DepartmentModel.findOne({ _id: id, city });
      if (!department) badInput('Department not found');
      if (name) department!.name = name;
      if (description !== undefined) department!.description = description;
      await department!.save();
      return mapDepartment(department);
    },

    deleteDepartment: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const department = await DepartmentModel.findOne({ _id: id, city });
      if (!department) badInput('Department not found');
      const officersInDept = await UserModel.countDocuments({ department: id });
      if (officersInDept > 0) badInput('Cannot delete a department with officers still assigned to it');
      await DepartmentModel.deleteOne({ _id: id });
      return true;
    },

    createStaffUser: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      const { city, user: admin } = requireRole(ctx, ['admin']);
      const role = roleFromGQL(input.role);
      if (role === 'citizen' || role === 'admin') {
        badInput('Use registerCitizen for citizens; a second Admin cannot be self-provisioned here');
      }
      if (role === 'nagarsevak' && !input.wardId) badInput('wardId is required for Nagarsevak');
      if (role === 'officer' && !input.departmentId) badInput('departmentId is required for Officer');

      const existing = await UserModel.findOne({ mobile: input.mobile });
      if (existing) badInput('A user with this mobile already exists');

      const user = await UserModel.create({
        name: input.name,
        mobile: input.mobile,
        role,
        city,
        ward: input.wardId ?? undefined,
        department: input.departmentId ?? undefined,
        createdBy: admin._id,
      });

      if (role === 'nagarsevak') {
        await WardModel.findByIdAndUpdate(input.wardId, { nagarsevak: user._id });
      }

      const populated = await UserModel.findById(user._id).populate('ward').populate('department');
      return mapUser(populated);
    },

    updateStaffUser: async (_: unknown, { id, input }: { id: string; input: any }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const user = await UserModel.findOne({ _id: id, city });
      if (!user) badInput('Staff member not found');
      if (user!.role === 'admin') badInput('Admin accounts cannot be edited here');

      if (input.mobile && input.mobile !== user!.mobile) {
        const existing = await UserModel.findOne({ mobile: input.mobile });
        if (existing) badInput('A user with this mobile already exists');
        user!.mobile = input.mobile;
      }
      if (input.name) user!.name = input.name;

      if (input.wardId && user!.role === 'nagarsevak') {
        if (user!.ward && String(user!.ward) !== String(input.wardId)) {
          await WardModel.findByIdAndUpdate(user!.ward, { $unset: { nagarsevak: 1 } });
        }
        user!.ward = input.wardId;
        await WardModel.findByIdAndUpdate(input.wardId, { nagarsevak: user!._id });
      }
      if (input.departmentId && user!.role === 'officer') {
        user!.department = input.departmentId;
      }

      await user!.save();
      const populated = await UserModel.findById(user!._id).populate('ward').populate('department');
      return mapUser(populated);
    },

    setStaffActive: async (_: unknown, { id, isActive }: { id: string; isActive: boolean }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const target = await UserModel.findOne({ _id: id, city });
      if (!target) badInput('Staff member not found');
      if (target!.role === 'admin') badInput('Admin accounts cannot be deactivated here');
      const user = await UserModel.findOneAndUpdate({ _id: id, city }, { isActive }, { new: true })
        .populate('ward')
        .populate('department');
      if (!user) badInput('Staff member not found');
      return mapUser(user);
    },

    deleteStaffUser: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const user = await UserModel.findOne({ _id: id, city });
      if (!user) badInput('Staff member not found');
      if (user!.role === 'citizen') badInput('Use citizen management for citizen accounts');
      if (user!.role === 'admin') badInput('Admin accounts cannot be deleted here');

      if (user!.role === 'nagarsevak' && user!.ward) {
        await WardModel.findByIdAndUpdate(user!.ward, { $unset: { nagarsevak: 1 } });
      }
      await VehicleModel.updateMany({ driver: user!._id }, { $unset: { driver: 1 } });

      await UserModel.deleteOne({ _id: id });
      return true;
    },
  },
};
