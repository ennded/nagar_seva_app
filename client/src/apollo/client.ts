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
});
