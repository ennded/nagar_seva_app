import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { clearAuthSession, loadAuthSession } from './authStorage';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const session = loadAuthSession();
  return {
    headers: {
      ...headers,
      ...(session ? { authorization: `Bearer ${session.token}` } : {}),
    },
  };
});

// Any UNAUTHENTICATED error (expired/invalid JWT) means the stored session is dead —
// clear it and bounce to that city's home page so the app doesn't keep retrying with a bad token.
const errorLink = onError(({ graphQLErrors }) => {
  const unauthenticated = graphQLErrors?.some((err) => err.extensions?.code === 'UNAUTHENTICATED');
  if (unauthenticated) {
    const citySlug = loadAuthSession()?.citySlug;
    clearAuthSession();
    window.location.href = citySlug ? `/${citySlug}` : '/';
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    // Without this, inline fragments on the RequestUnion union / RequestBase interface
    // (`... on Complaint { ... }`) can't be matched during cache writes, so the cache
    // silently keeps only __typename/id and drops every field inside the fragment.
    possibleTypes: {
      RequestUnion: ['Complaint', 'Appointment'],
      RequestBase: ['Complaint', 'Appointment'],
    },
  }),
  defaultOptions: {
    // Different roles (officer, admin, nagarsevak, nagaradhyaksh) are separate sessions with
    // separate caches, so one user's change can't invalidate another's cache. Without this,
    // Apollo's default 'cache-first' policy means a page only ever fetches once per mount and
    // then serves stale data indefinitely (e.g. an officer's status change never appears on the
    // admin/nagarsevak/nagaradhyaksh dashboards until a hard reload).
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
