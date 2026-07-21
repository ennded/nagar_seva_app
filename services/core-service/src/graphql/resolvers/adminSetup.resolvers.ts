import { WardModel } from '../../models/Ward.js';
import { DepartmentModel } from '../../models/Department.js';
import { UserModel } from '../../models/User.js';
import { requireRole, badInput } from '../../auth/authorize.js';
import { mapWard, mapDepartment, mapUser, roleFromGQL } from '../serialize.js';
import type { GraphQLContext } from '../../auth/context.js';

export const adminSetupResolvers = {
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

      return mapUser(user);
    },
  },
};
