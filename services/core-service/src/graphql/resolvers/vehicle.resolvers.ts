import { VehicleModel } from '../../models/Vehicle.js';
import { requireRole, badInput, notFound, forbidden } from '../../auth/authorize.js';
import { mapVehicle } from '../serialize.js';
import type { GraphQLContext } from '../../auth/context.js';

function populate(query: any) {
  return query.populate('ward').populate('driver');
}

export const vehicleResolvers = {
  Query: {
    vehiclesByCity: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin', 'nagaradhyaksh']);
      const vehicles = await populate(VehicleModel.find({ city }).sort({ createdAt: -1 }));
      return vehicles.map(mapVehicle);
    },

    myVehicle: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['driver']);
      const vehicle = await populate(VehicleModel.findOne({ driver: user._id }));
      return vehicle ? mapVehicle(vehicle) : null;
    },

    myWardVehicle: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['citizen', 'nagarsevak']);
      if (!user.ward) return null;
      const vehicle = await populate(VehicleModel.findOne({ ward: user.ward }));
      return vehicle ? mapVehicle(vehicle) : null;
    },
  },

  Mutation: {
    createVehicle: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      const { city } = requireRole(ctx, ['admin']);
      const existing = await VehicleModel.findOne({ city, ward: input.wardId });
      if (existing) badInput('This ward already has a vehicle assigned');
      const vehicle = await VehicleModel.create({
        city,
        ward: input.wardId,
        registrationNumber: input.registrationNumber,
        driver: input.driverId ?? undefined,
      });
      const populated = await populate(VehicleModel.findById(vehicle._id));
      return mapVehicle(populated);
    },

    assignVehicleDriver: async (
      _: unknown,
      { vehicleId, driverId }: { vehicleId: string; driverId: string },
      ctx: GraphQLContext,
    ) => {
      const { city } = requireRole(ctx, ['admin']);
      const vehicle = await VehicleModel.findOneAndUpdate({ _id: vehicleId, city }, { driver: driverId }, { new: true });
      if (!vehicle) notFound('Vehicle not found');
      const populated = await populate(VehicleModel.findById(vehicle!._id));
      return mapVehicle(populated);
    },

    startDuty: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['driver']);
      const vehicle = await VehicleModel.findOneAndUpdate({ driver: user._id }, { onDuty: true }, { new: true });
      if (!vehicle) forbidden('No vehicle is assigned to you yet');
      const populated = await populate(VehicleModel.findById(vehicle!._id));
      return mapVehicle(populated);
    },

    endDuty: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['driver']);
      const vehicle = await VehicleModel.findOneAndUpdate({ driver: user._id }, { onDuty: false }, { new: true });
      if (!vehicle) forbidden('No vehicle is assigned to you yet');
      const populated = await populate(VehicleModel.findById(vehicle!._id));
      return mapVehicle(populated);
    },

    updateVehicleLocation: async (_: unknown, { lat, lng }: { lat: number; lng: number }, ctx: GraphQLContext) => {
      const { user } = requireRole(ctx, ['driver']);
      const vehicle = await VehicleModel.findOneAndUpdate(
        { driver: user._id },
        { currentLat: lat, currentLng: lng, locationUpdatedAt: new Date() },
        { new: true },
      );
      if (!vehicle) forbidden('No vehicle is assigned to you yet');
      const populated = await populate(VehicleModel.findById(vehicle!._id));
      return mapVehicle(populated);
    },
  },
};
