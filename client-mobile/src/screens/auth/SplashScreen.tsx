import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../auth/AuthContext';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

// S0.1 — first launch → CityPicker · saved city + session → Home (a rejected token bounces back
// to Landing reactively via AuthContext's session-expired handler, not decided here) · saved
// city, no session → Landing.
export function SplashScreen({ navigation }: Props) {
  const { isAuthenticated, session } = useAuth();

  useEffect(() => {
    const citySlug = getSavedCitySlug();
    const routeName = !citySlug
      ? 'CityPicker'
      : !isAuthenticated
        ? 'Landing'
        : session?.user.role === 'DRIVER'
          ? 'DriverDashboard'
          : session?.user.role === 'OFFICER'
            ? 'OfficerTabs'
            : session?.user.role === 'NAGARSEVAK'
              ? 'NagarsevakTabs'
              : session?.user.role === 'NAGARADHYAKSH'
                ? 'NagaradhyakshTabs'
                : session?.user.role === 'ADMIN'
                  ? 'AdminTabs'
                  : 'Home';
    navigation.reset({ index: 0, routes: [{ name: routeName }] });
  }, [isAuthenticated, session, navigation]);

  return (
    <View style={styles.center}>
      <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Nagar Seva</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  logo: { width: 96, height: 96, marginBottom: 12 },
  title: { fontFamily: fonts.serifExtraBold, fontSize: 28, color: colors.white },
});
