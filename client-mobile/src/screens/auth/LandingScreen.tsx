import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Briefcase, Phone } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CITY_BY_SLUG, PUBLIC_DASHBOARD_STATS } from '../../graphql/queries/public.queries';
import type { City, PublicDashboardStats } from '../../graphql/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import { setLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

// S1 — reached after city pick, after logout, or when no session exists. The mockup's own spec
// (citizen-mock, "Deliberately absent") says no language toggle on this flow, but the app already
// has a real EN/MR i18n system on the web client — added here per explicit instruction to surface
// backend-supported features the mockup omits.
export function LandingScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const citySlug = getSavedCitySlug() ?? '';
  const { data } = useQuery<{ cityBySlug: City | null }>(CITY_BY_SLUG, { variables: { slug: citySlug }, skip: !citySlug });
  const { data: statsData } = useQuery<{ publicDashboardStats: PublicDashboardStats }>(PUBLIC_DASHBOARD_STATS, {
    variables: { citySlug },
    skip: !citySlug,
  });
  const city = data?.cityBySlug;
  const stats = statsData?.publicDashboardStats;

  const landingStats = stats
    ? [
        { value: String(stats.totalCitizens), label: t('landing.statCitizens') },
        { value: String(stats.totalResolvedComplaints), label: t('landing.statResolved') },
        { value: String(stats.totalWards), label: t('landing.statWards') },
      ]
    : [];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.navy, '#14567F', colors.green]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>नस</Text>
            </View>
            <View>
              <Text style={styles.brandName}>{t('landing.brandName')}</Text>
              <Text style={styles.cityName}>{t('landing.cityMunicipalCorporation', { city: (city?.name ?? citySlug).toUpperCase() })}</Text>
            </View>
          </View>
          <View style={styles.langToggle}>
            <Pressable
              style={[styles.langOption, i18n.language === 'en' && styles.langOptionActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langOptionText, i18n.language === 'en' && styles.langOptionTextActive]}>EN</Text>
            </Pressable>
            <Pressable
              style={[styles.langOption, i18n.language === 'mr' && styles.langOptionActive]}
              onPress={() => setLanguage('mr')}
            >
              <Text style={[styles.langOptionText, i18n.language === 'mr' && styles.langOptionTextActive]}>मर</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.headline}>{t('landing.headline')}</Text>
        <Text style={styles.subtitle}>{t('landing.subtitle')}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => navigation.navigate('LoginEmail')}>
          <User size={19} color={colors.white} />
          <Text style={styles.primaryLabel}>{t('landing.citizenButton')}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => navigation.navigate('StaffRoleSelect')}>
          <Briefcase size={18} color={colors.navy} />
          <Text style={styles.secondaryLabel}>{t('landing.staffButton')}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => navigation.navigate('EmergencyContacts')}>
          <Phone size={18} color={colors.red} />
          <Text style={styles.secondaryLabel}>{t('landing.emergencyButton')}</Text>
        </Pressable>
        <Pressable style={styles.changeCity} onPress={() => navigation.navigate('CityPicker')}>
          <Text style={styles.changeCityLabel}>{t('landing.changeCity')}</Text>
        </Pressable>

        {landingStats.length > 0 && (
          <View style={styles.statsRow}>
            {landingStats.map((s) => (
              <View key={s.label} style={styles.statTile}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  hero: { paddingTop: 56, paddingHorizontal: 22, paddingBottom: 26 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  langToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: 3, gap: 2 },
  langOption: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  langOptionActive: { backgroundColor: colors.white },
  langOptionText: { fontSize: 12, fontFamily: fonts.sansExtraBold, color: 'rgba(255,255,255,0.85)' },
  langOptionTextActive: { color: colors.navy },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  brandBadge: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  brandBadgeText: { fontFamily: fonts.serifExtraBold, fontSize: 14, color: colors.white },
  brandName: { fontFamily: fonts.serifExtraBold, fontSize: 19, color: colors.white },
  cityName: { fontSize: 11.5, fontFamily: fonts.sansBold, letterSpacing: 0.6, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  headline: { fontFamily: fonts.serifExtraBold, fontSize: 27, lineHeight: 32, color: colors.white, marginTop: 22 },
  subtitle: { fontSize: 13.5, lineHeight: 21, color: 'rgba(255,255,255,0.92)', marginTop: 10 },
  body: { flex: 1, padding: 20, gap: 10 },
  primaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryButton: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  pressed: { opacity: 0.85 },
  primaryLabel: { fontFamily: fonts.sansExtraBold, fontSize: 16.5, color: colors.white },
  secondaryLabel: { fontFamily: fonts.sansExtraBold, fontSize: 15, color: colors.text },
  changeCity: { alignSelf: 'center', marginTop: 6, minHeight: 44, justifyContent: 'center' },
  changeCityLabel: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.navy, textDecorationLine: 'underline' },
  statsRow: { marginTop: 'auto', flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12 },
  statValue: { fontFamily: fonts.serifExtraBold, fontSize: 19, color: colors.navy },
  statLabel: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.sansBold, marginTop: 3 },
});
