import { WardModel } from '../../models/Ward.js';
import { DepartmentModel } from '../../models/Department.js';
import { UserModel } from '../../models/User.js';
import { requireRole, badInput } from '../../auth/authorize.js';
import { mapWard, mapDepartment, mapUser, roleFromGQL } from '../serialize.js';
import type { GraphQLContext } from '../../auth/context.js';

export const adminSetupResolvers = {
  Query: {
    staffByCity: async (_: unknown, { role }: { role?: string }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const filter: Record<string, unknown> = role ? { city, role: roleFromGQL(role) } : { city, role: { $ne: 'citizen' } };
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

    createDepartment: async (
      _: unknown,
      { name, description }: { name: string; description?: string },
      ctx: GraphQLContext,
    ) => {
      const { city } = requireRole(ctx, ['admin']);
      const department = await DepartmentModel.create({ city, name, description });
      return mapDepartment(department);
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
      if (user!.role === 'citizen') badInput('Use citizen management for citizen accounts');

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
      const user = await UserModel.findOneAndUpdate({ _id: id, city }, { isActive }, { new: true })
        .populate('ward')
        .populate('department');
      if (!user) badInput('Staff member not found');
      return mapUser(user);
    },
  },
};
