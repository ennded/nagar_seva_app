import * as SecureStore from 'expo-secure-store';

const KEY = 'nagarseva_city_slug';

// Same async-with-cache pattern as authStorage.ts — SecureStore's sync API isn't available on
// web. cachedSlug is hydrated once at boot via initCitySlug() (see App.tsx).
let cachedSlug: string | null = null;

export async function initCitySlug(): Promise<string | null> {
  cachedSlug = await SecureStore.getItemAsync(KEY);
  return cachedSlug;
}

export function getSavedCitySlug(): string | null {
  return cachedSlug;
}

export function saveCitySlug(slug: string): void {
  cachedSlug = slug;
  SecureStore.setItemAsync(KEY, slug).catch(() => {});
}
