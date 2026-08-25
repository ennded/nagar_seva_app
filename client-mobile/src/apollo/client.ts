import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GRAPHQL_URL } from '../config';
import { clearAuthSession, loadAuthSession } from './authStorage';

const httpLink = new HttpLink({ uri: GRAPHQL_URL });

const authLink = setContext((_, { headers }) => {
  const session = loadAuthSession();
  return {
    headers: {
      ...headers,
      ...(session ? { authorization: `Bearer ${session.token}` } : {}),
    },
  };
});

// Mirrors the web client's errorLink: an UNAUTHENTICATED response means the stored token is dead
// (expired/invalid). onSessionExpired lets the navigator bounce back to the login screen — there's
// no window.location to redirect with here, so the app shell owns that instead.
let loggingOut = false;
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

const errorLink = onError(({ graphQLErrors, operation }) => {
  const unauthenticated = graphQLErrors?.some((err) => err.extensions?.code === 'UNAUTHENTICATED');
  if (!unauthenticated || loggingOut) return;

  const session = loadAuthSession();
  if (!session) return;

  const sentAuthHeader = (operation.getContext().headers as Record<string, string> | undefined)?.authorization;
  if (sentAuthHeader !== `Bearer ${session.token}`) return;

  loggingOut = true;
  clearAuthSession();
  onSessionExpired?.();
  loggingOut = false;
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    possibleTypes: {
      RequestUnion: ['Complaint', 'Appointment'],
      RequestBase: ['Complaint', 'Appointment'],
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
