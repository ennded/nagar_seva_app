import Constants from 'expo-constants';

// 10.0.2.2 is the Android emulator's alias for the host machine's localhost — it works out of
// the box in an emulator, but a physical phone running Expo Go needs your machine's real LAN IP
// instead (e.g. http://192.168.1.23:4000/graphql), since "localhost" on the phone means itself.
// Override without editing code: `EXPO_PUBLIC_GRAPHQL_URL=http://<lan-ip>:4000/graphql npm start`.
const extra = (Constants.expoConfig?.extra ?? {}) as { graphqlUrl?: string; mediaUrl?: string };

export const GRAPHQL_URL = process.env.EXPO_PUBLIC_GRAPHQL_URL ?? extra.graphqlUrl ?? 'http://10.0.2.2:4000/graphql';
export const MEDIA_URL = process.env.EXPO_PUBLIC_MEDIA_URL ?? extra.mediaUrl ?? 'http://10.0.2.2:4003';
