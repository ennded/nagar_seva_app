import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Shield, Flame, Ambulance, Building2, Droplets, Zap, Phone as PhoneIcon } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../auth/AuthContext';
import { EMERGENCY_CONTACTS } from '../../graphql/queries/public.queries';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { EmergencyContact } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmergencyContacts'>;

const CATEGORY_ICON: Record<string, { Icon: typeof Shield; bg: string; color: string }> = {
  POLICE: { Icon: Shield, bg: '#EAF0F9', color: '#1D4ED8' },
  FIRE: { Icon: Flame, bg: colors.redLight, color: colors.red },
  AMBULANCE: { Icon: Ambulance, bg: colors.redLight, color: colors.red },
  MUNICIPALITY: { Icon: Building2, bg: colors.navyLight, color: colors.navy },
  WATER: { Icon: Droplets, bg: '#EAF0F9', color: '#1D4ED8' },
  ELECTRICITY: { Icon: Zap, bg: colors.amberLight, color: colors.amber },
};

// S10.1 — reachable with or without a session (Landing → About/Emergency, or Home tile once
// logged in), so it reads the city from local storage rather than requiring auth.
export function EmergencyContactsScreen(_props: Props) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const citySlug = session?.citySlug ?? getSavedCitySlug() ?? '';

  const { data, loading } = useQuery<{ emergencyContacts: EmergencyContact[] }>(EMERGENCY_CONTACTS, {
    variables: { citySlug },
    skip: !citySlug,
  });
  const contacts = [...(data?.emergencyContacts ?? [])].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('emergencyContacts.headerTitle')}</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.subtitle}>{t('emergencyContacts.subtitle')}</Text>
        {loading && contacts.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.navy} />
        ) : contacts.length === 0 ? (
          <Text style={styles.empty}>{t('emergencyContacts.empty')}</Text>
        ) : (
          <View style={styles.list}>
            {contacts.map((item) => {
              const tone = CATEGORY_ICON[item.category] ?? { Icon: PhoneIcon, bg: colors.background, color: colors.muted };
              const { Icon } = tone;
              return (
                <Pressable key={item.id} style={styles.card} onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}>
                  <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
                    <Icon size={20} color={tone.color} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardCategory}>{t(`emergencyCategory.${item.category}`)}</Text>
                  </View>
                  <View style={styles.callGroup}>
                    <Text style={styles.phone}>{item.phoneNumber}</Text>
                    <View style={styles.callButton}>
                      <PhoneIcon size={17} color={colors.green} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.navy },
  headerTitle: { fontFamily: fonts.serifExtraBold, fontSize: 19, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18 },
  subtitle: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  empty: { marginTop: 16, color: colors.muted, fontSize: 13 },
  list: { marginTop: 14, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, minHeight: 70 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: fonts.sansExtraBold, color: colors.text },
  cardCategory: { fontSize: 12.5, color: colors.muted, marginTop: 3, fontFamily: fonts.sansSemibold, textTransform: 'capitalize' },
  callGroup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  phone: { fontFamily: 'ui-monospace', fontSize: 15, fontWeight: '800', color: colors.navy },
  callButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
});
