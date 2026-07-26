import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { apolloClient } from '../../apollo/client';
import { clearAuthSession, loadAuthSession, saveAuthSession, type AuthSession } from '../../apollo/authStorage';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadAuthSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      login: (newSession) => {
        saveAuthSession(newSession);
        setSession(newSession);
      },
      logout: () => {
        clearAuthSession();
        setSession(null);
        // clearStore()/resetStore() cancel any in-flight query at the moment they run —
        // including the page we're about to navigate to (e.g. the landing page's own
        // CityBySlug query), which then reads as "not found" instead of just cancelled.
        // cache.reset() clears the same data without that cancellation side effect.
        apolloClient.cache.reset();
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
