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
//
// A page mounts several queries at once (dashboard stats, staff list, notifications, ...), so a
// single stray UNAUTHENTICATED from one of them must not be trusted blindly: it may have been sent
// with a token that's no longer the active session's (a login/logout race), or it may arrive after
// we've already started logging out. Only act when the failing request actually used the session
// that's still current, and only act once per dead session.
let loggingOut = false;

const errorLink = onError(({ graphQLErrors, operation }) => {
  const unauthenticated = graphQLErrors?.some((err) => err.extensions?.code === 'UNAUTHENTICATED');
  if (!unauthenticated || loggingOut) return;

  const session = loadAuthSession();
  if (!session) return;

  const sentAuthHeader = (operation.getContext().headers as Record<string, string> | undefined)?.authorization;
  if (sentAuthHeader !== `Bearer ${session.token}`) return;

  loggingOut = true;
  clearAuthSession();
  window.location.href = session.citySlug ? `/${session.citySlug}` : '/';
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
