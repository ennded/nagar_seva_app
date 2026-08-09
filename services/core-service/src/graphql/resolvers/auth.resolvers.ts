import { CityModel } from '../../models/City.js';
import { WardModel } from '../../models/Ward.js';
import { UserModel } from '../../models/User.js';
import { signToken } from '../../auth/jwt.js';
import { requestOtp as sendOtp, verifyOtp as checkOtp } from '../../auth/otp.js';
import { requireAuth, badInput } from '../../auth/authorize.js';
import { mapUser } from '../serialize.js';
import type { GraphQLContext } from '../../auth/context.js';

async function issueAuthPayload(user: any, citySlugHint?: string) {
  const city = citySlugHint ? { slug: citySlugHint } : await CityModel.findById(user.city).select('slug');
  const token = signToken({ sub: String(user._id), role: user.role, city: String(user.city) });
  const populated = await user.populate(['ward', 'department']);
  return { token, user: mapUser(populated), citySlug: city?.slug ?? '' };
}

export const authResolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: GraphQLContext) => (ctx.user ? mapUser(ctx.user) : null),
  },
  Mutation: {
    registerCitizen: async (_: unknown, { input }: { input: any }) => {
      const city = await CityModel.findOne({ slug: input.citySlug, isActive: true });
      if (!city) badInput(`No city found for slug "${input.citySlug}"`);
      const ward = await WardModel.findOne({ _id: input.wardId, city: city._id });
      if (!ward) badInput('Ward does not belong to this city');

      const existing = await UserModel.findOne({ $or: [{ mobile: input.mobile }, { email: input.email }] });
      if (existing) badInput('A user with this mobile or email already exists');

      const user = await UserModel.create({
        name: input.name,
        mobile: input.mobile,
        email: input.email,
        passwordHash: input.password,
        role: 'citizen',
        city: city._id,
        ward: ward._id,
        aadharDocUrl: input.aadharDocUrl,
        voterIdDocUrl: input.voterIdDocUrl,
      });
      return issueAuthPayload(user, city.slug);
    },

    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const user = await UserModel.findOne({ email, role: 'citizen' }).select('+passwordHash');
      if (!user || !(await user.comparePassword(password))) {
        badInput('Invalid email or password');
      }
      if (!user!.isActive) badInput('Account is inactive');
      return issueAuthPayload(user);
    },

    requestOtp: async (_: unknown, { mobile }: { mobile: string }) => {
      const user = await UserModel.findOne({ mobile });
      if (user && user.isActive) {
        await sendOtp(mobile);
      }
      // Always return true regardless of whether the mobile is registered, so the
      // response can't be used to enumerate which numbers exist in the system.
      return true;
    },

    verifyOtp: async (_: unknown, { mobile, code }: { mobile: string; code: string }) => {
      const result = await checkOtp(mobile, code);
      if (result !== 'ok') {
        badInput(`OTP verification failed: ${result}`);
      }
      const user = await UserModel.findOne({ mobile });
      if (!user || !user.isActive) badInput('No active account for this mobile number');
      return issueAuthPayload(user);
    },
  },
};
