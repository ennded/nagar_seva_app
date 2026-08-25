import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { CITIES } from '../../graphql/queries/public.queries';
import type { City } from '../../graphql/types';
import { saveCitySlug } from '../../storage/citySlug';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CityPicker'>;

// S0 — first launch only; picked city persists on the device from here on.
export function CityPickerScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ cities: City[] }>(CITIES);

  function selectCity(slug: string) {
    saveCitySlug(slug);
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

  return (
    <Screen scroll={false}>
      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { backgroundColor: colors.orange }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.navy }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.green }]} />
      </View>

      <View style={styles.body}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>नस</Text>
          </View>
          <Text style={styles.brandName}>Nagar Seva</Text>
        </View>

        <Text style={styles.title}>{t('cityPicker.title')}</Text>
        <Text style={styles.subtitle}>{t('cityPicker.subtitle')}</Text>

        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.list}>
            {(data?.cities ?? []).map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => selectCity(item.slug)}
              >
                <Building2 size={19} color={colors.navy} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.address ? <Text style={styles.cardSub}>{item.address}</Text> : null}
                </View>
                <ChevronRight size={17} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', height: 4 },
  progressBar: { flex: 1 },
  body: { flex: 1, padding: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 20 },
  brandBadge: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  brandBadgeText: { fontFamily: fonts.serifExtraBold, fontSize: 15, color: colors.navy },
  brandName: { fontFamily: fonts.serifExtraBold, fontSize: 21, color: colors.text },
  title: { fontFamily: fonts.serifExtraBold, fontSize: 25, color: colors.text, marginTop: 20 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 6, lineHeight: 20 },
  list: { marginTop: 16, gap: 9 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, minHeight: 64 },
  pressed: { opacity: 0.7 },
  cardName: { fontFamily: fonts.sansExtraBold, fontSize: 15.5, color: colors.text },
  cardSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
});
