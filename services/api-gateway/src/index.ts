import 'dotenv/config';
import express, { json } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';

const PORT = Number(process.env.GATEWAY_PORT ?? 4000);
const CORE_SERVICE_GRAPHQL_URL = process.env.CORE_SERVICE_GRAPHQL_URL ?? 'http://localhost:4001/graphql';
const NOTIFICATION_SERVICE_GRAPHQL_URL =
  process.env.NOTIFICATION_SERVICE_GRAPHQL_URL ?? 'http://localhost:4002/graphql';

// Forwards the client's Authorization header unchanged to every subgraph — the gateway
// does no auth logic itself, each subgraph independently verifies the JWT core-service issued.
class AuthForwardingDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: any) {
    const auth = context?.authorization;
    if (auth) {
      request.http.headers.set('authorization', auth);
    }
  }
}

async function main() {
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        { name: 'core-service', url: CORE_SERVICE_GRAPHQL_URL },
        { name: 'notification-service', url: NOTIFICATION_SERVICE_GRAPHQL_URL },
      ],
    }),
    buildService({ url }) {
      return new AuthForwardingDataSource({ url });
    },
  });

  const apollo = new ApolloServer({ gateway });
  await apollo.start();

  const app = express();
  app.use(cors());
  app.use(
    '/graphql',
    json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => ({ authorization: req.headers.authorization }),
    }),
  );

  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => {
    console.log(`api-gateway listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
