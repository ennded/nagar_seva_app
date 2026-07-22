import type { IncomingMessage } from 'http';
import { verifyToken } from './jwt.js';
import { UserModel, type User } from '../models/User.js';

export interface GraphQLContext {
  user: User | null;
}

export async function buildContext({ req }: { req: IncomingMessage }): Promise<GraphQLContext> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return { user: null };
  }
  const token = header.slice('Bearer '.length);
  const payload = verifyToken(token);
  if (!payload) {
    return { user: null };
  }
  const user = await UserModel.findById(payload.sub).populate('ward').populate('department');
  if (!user || !user.isActive) {
    return { user: null };
  }
  return { user: user as unknown as User };
}
