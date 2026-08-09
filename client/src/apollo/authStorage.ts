import type { AuthPayload } from '../graphql/types';

export type AuthSession = AuthPayload;

const STORAGE_KEY = 'nagarseva_auth';

// sessionStorage, not localStorage: localStorage is shared across every tab of this origin, so
// logging into a different role/account in one tab would silently overwrite the session another
// tab was using — that tab keeps working off stale in-memory state until its next refresh, at
// which point it reads the now-swapped-out session and gets bounced as if logged out. Staff
// commonly have several roles open in separate tabs at once (citizen + officer + admin), so this
// isn't an edge case. sessionStorage is per-tab, so each tab keeps its own independent session.
export function loadAuthSession(): AuthSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
