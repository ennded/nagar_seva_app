import * as SecureStore from 'expo-secure-store';
import type { AuthPayload } from '../graphql/types';

export type AuthSession = AuthPayload;

const STORAGE_KEY = 'nagarseva_auth';

// SecureStore's synchronous getItem/setItem aren't implemented on web (and aren't reliable
// everywhere on native either), but Apollo's authLink needs a synchronous read on every request.
// So we keep our own in-memory cache, hydrated once at boot via initAuthSession() (see App.tsx),
// and read/write that cache synchronously everywhere else, persisting to SecureStore in the
// background.
let cachedSession: AuthSession | null = null;

export async function initAuthSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  cachedSession = raw ? safeParse(raw) : null;
  return cachedSession;
}

function safeParse(raw: string): AuthSession | null {
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function loadAuthSession(): AuthSession | null {
  return cachedSession;
}

export function saveAuthSession(session: AuthSession): void {
  cachedSession = session;
  SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session)).catch(() => {});
}

export function clearAuthSession(): void {
  cachedSession = null;
  SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
}
