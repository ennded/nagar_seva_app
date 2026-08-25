import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  PublicSans_800ExtraBold,
} from '@expo-google-fonts/public-sans';
import { SourceSerif4_700Bold, SourceSerif4_800ExtraBold } from '@expo-google-fonts/source-serif-4';
import { apolloClient } from './src/apollo/client';
import { initAuthSession } from './src/apollo/authStorage';
import { initCitySlug } from './src/storage/citySlug';
import { initLanguage } from './src/i18n';
import { ToastProvider } from './src/components/Toast';
import { AuthProvider } from './src/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors, fonts } from './src/theme';

// Global default so every Text/TextInput across the app inherits Public Sans without needing to
// touch every individual screen's styles — screens that want a specific weight/serif heading
// still set fontFamily explicitly, which overrides this default.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).defaultProps = (Text as any).defaultProps || {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).defaultProps.style = [{ fontFamily: fonts.sansRegular }, (Text as any).defaultProps.style];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(TextInput as any).defaultProps.style = [{ fontFamily: fonts.sansRegular }, (TextInput as any).defaultProps.style];

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [fontsLoaded] = useFonts({
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
    SourceSerif4_700Bold,
    SourceSerif4_800ExtraBold,
  });

  // Both caches must be hydrated from SecureStore before AuthContext/screens read them
  // synchronously — see the comments in authStorage.ts and storage/citySlug.ts.
  useEffect(() => {
    Promise.all([initAuthSession(), initCitySlug(), initLanguage()]).finally(() => setHydrated(true));
  }, []);

  if (!hydrated || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}>
          <ActivityIndicator color={colors.white} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ApolloProvider client={apolloClient}>
        <ToastProvider>
          <AuthProvider>
            <RootNavigator />
            <StatusBar style="dark" />
          </AuthProvider>
        </ToastProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}
