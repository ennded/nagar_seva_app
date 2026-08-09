import express, { json } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers/index.js';
import { buildContext } from './auth/context.js';
import { reportsRouter } from './rest/reports.js';

async function main() {
  await connectDb();

  const app = express();
  app.use(cors());

  const apollo = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers: resolvers as any }),
  });
  await apollo.start();

  app.use('/graphql', json(), expressMiddleware(apollo, { context: buildContext as any }));

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.use('/reports', reportsRouter);

  app.listen(env.port, () => {
    console.log(`core-service listening on :${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
