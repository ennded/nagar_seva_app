import { publicResolvers } from './public.resolvers.js';
import { authResolvers } from './auth.resolvers.js';
import { adminSetupResolvers } from './adminSetup.resolvers.js';
import { requestResolvers } from './request.resolvers.js';
import { announcementResolvers } from './announcement.resolvers.js';

export const resolvers = {
  Query: {
    ...publicResolvers.Query,
    ...authResolvers.Query,
    ...requestResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...adminSetupResolvers.Mutation,
    ...requestResolvers.Mutation,
    ...announcementResolvers.Mutation,
  },
  RequestUnion: requestResolvers.RequestUnion,
  RequestBase: {
    __resolveType: (obj: any) => obj.__typename,
  },
};
