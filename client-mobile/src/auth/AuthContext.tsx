import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apolloClient, setSessionExpiredHandler } from '../apollo/client';
import { clearAuthSession, loadAuthSession, saveAuthSession, type AuthSession } from '../apollo/authStorage';
import { navigationRef } from '../navigation/navigationRef';
import { useToast } from '../components/Toast';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadAuthSession());
  const { showToast } = useToast();

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      login: (newSession) => {
        saveAuthSession(newSession);
        setSession(newSession);
        apolloClient.cache.reset();
      },
      logout: () => {
        clearAuthSession();
        setSession(null);
        apolloClient.cache.reset();
      },
    }),
    [session],
  );

  useEffect(() => {
    // S0.3: a rejected token bounces to Login (not the screen that failed — there's no
    // deep-link restore) with a toast, distinct from the silent reset a manual logout does.
    setSessionExpiredHandler(() => {
      setSession(null);
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Landing' }] });
      }
      showToast('Your session expired. Please log in again.');
    });
    return () => setSessionExpiredHandler(null);
  }, [showToast]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
