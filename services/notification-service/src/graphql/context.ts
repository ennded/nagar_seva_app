import type { IncomingMessage } from 'http';
import { verifyToken, type JwtPayload } from '../auth/jwt.js';

export interface GraphQLContext {
  user: JwtPayload | null;
}

export async function buildContext({ req }: { req: IncomingMessage }): Promise<GraphQLContext> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return { user: null };
  const payload = verifyToken(header.slice('Bearer '.length));
  return { user: payload };
}
