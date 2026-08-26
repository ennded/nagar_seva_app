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

const STARTUP_ATTEMPT_TIMEOUT_MS = 20_000;
const RETRY_BACKOFF_START_MS = 5_000;
const RETRY_BACKOFF_MAX_MS = 60_000;

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

function createGatewayServer(): ApolloServer {
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
  return new ApolloServer({ gateway });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// On Render's free tier, subgraphs spin down after 15min idle, so the gateway can start up before
// they're awake. IntrospectAndCompose's first schema fetch can then hang indefinitely against a
// cold/502ing subgraph without apollo.start() ever resolving or rejecting — previously this meant
// the gateway got permanently stuck and needed a manual restart. Instead, bound each attempt with a
// timeout and keep retrying with a fresh gateway instance + backoff until composition succeeds.
async function startGatewayWithRetry(): Promise<ApolloServer> {
  let backoff = RETRY_BACKOFF_START_MS;
  for (let attempt = 1; ; attempt++) {
    const apollo = createGatewayServer();
    try {
      await withTimeout(apollo.start(), STARTUP_ATTEMPT_TIMEOUT_MS);
      console.log(`gateway schema composition succeeded on attempt ${attempt}`);
      return apollo;
    } catch (err) {
      console.error(`gateway startup attempt ${attempt} failed, retrying in ${backoff}ms:`, err);
      await apollo.stop().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, backoff));
      backoff = Math.min(backoff * 2, RETRY_BACKOFF_MAX_MS);
    }
  }
}

async function main() {
  const app = express();
  app.use(cors());

  // Bind the port immediately so Render's health check passes and the service never shows as
  // "failed" while we're still waiting on cold subgraphs in the background.
  let ready = false;
  app.get('/healthz', (_req, res) => res.json({ ok: true, ready }));
  app.use('/graphql', json(), (_req, res, next) => {
    if (!ready) {
      res.status(503).json({ error: 'Gateway is still starting up (waiting on subgraphs) — retry shortly.' });
      return;
    }
    next();
  });

  app.listen(PORT, () => {
    console.log(`api-gateway listening on :${PORT}`);
  });

  const apollo = await startGatewayWithRetry();
  app.use(
    '/graphql',
    expressMiddleware(apollo, {
      context: async ({ req }) => ({ authorization: req.headers.authorization }),
    }),
  );
  ready = true;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
