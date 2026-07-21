import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { json } from 'express';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { buildContext } from './graphql/context.js';
import { handleNotify } from './internal/notify.js';

async function main() {
  await connectDb();

  const app = express();
  app.use(cors());

  // Internal endpoint — only core-service calls this, over the private docker/k8s network.
  app.post('/internal/notify', json(), handleNotify);

  const apollo = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers: resolvers as any }),
  });
  await apollo.start();

  app.use('/graphql', json(), expressMiddleware(apollo, { context: buildContext as any }));

  app.listen(env.port, () => {
    console.log(`notification-service listening on :${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
