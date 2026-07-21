import { GraphQLError } from 'graphql';
import type { GraphQLContext } from './context.js';
import type { Role } from 'shared';

export function requireAuth(ctx: GraphQLContext) {
  if (!ctx.user) {
    throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return ctx.user;
}

/**
 * Requires the caller to hold one of `roles`, and returns their scoped city id.
 * Resolvers must use the returned city id (never a client-supplied one) when
 * querying/mutating city-scoped data — this is the single tenant-isolation gate.
 */
export function requireRole(ctx: GraphQLContext, roles: Role[]) {
  const user = requireAuth(ctx);
  if (!roles.includes(user.role as Role)) {
    throw new GraphQLError('Not authorized for this action', { extensions: { code: 'FORBIDDEN' } });
  }
  return { user, city: user.city };
}

export function forbidden(message = 'Not authorized for this action'): never {
  throw new GraphQLError(message, { extensions: { code: 'FORBIDDEN' } });
}

export function notFound(message = 'Not found'): never {
  throw new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });
}

export function badInput(message: string): never {
  throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}
