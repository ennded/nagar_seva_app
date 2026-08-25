import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NoticeDetail'>;

const CATEGORY_TONE: Record<string, { bg: string; color: string }> = {
  GENERAL: { bg: colors.navyLight, color: colors.navy },
  WATER_SUPPLY: { bg: '#EAF0F9', color: '#1D4ED8' },
  ROAD_CLOSURE: { bg: colors.amberLight, color: colors.amber },
  EVENT: { bg: colors.purpleLight, color: colors.purple },
  TAX_REMINDER: { bg: colors.amberLight, color: colors.amber },
  SCHEME: { bg: colors.greenLight, color: colors.green },
  DEVELOPMENT_PROJECT: { bg: colors.cyanLight, color: colors.cyan },
  INFRASTRUCTURE: { bg: colors.cyanLight, color: colors.cyan },
};

// S8.2 — a one-way broadcast; read-only, back only. No acknowledgement or subscribe action exists.
export function NoticeDetailScreen({ route }: Props) {
  const { t } = useTranslation();
  const { announcement } = route.params;
  const tone = announcement.isEmergency ? { bg: colors.redLight, color: colors.red } : CATEGORY_TONE[announcement.category] ?? CATEGORY_TONE.GENERAL;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={[styles.categoryPill, { backgroundColor: tone.bg }]}>
        <Text style={[styles.categoryPillText, { color: tone.color }]}>
          {announcement.isEmergency ? t('announcementCategory.emergency') : t(`announcementCategory.${announcement.category}`)}
        </Text>
      </View>
      <Text style={styles.title}>{announcement.title}</Text>
      <View style={styles.dateRow}>
        <Calendar size={15} color={colors.muted} />
        <Text style={styles.date}>{t('notices.published', { date: new Date(announcement.publishedAt ?? announcement.createdAt).toLocaleDateString() })}</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.body}>{announcement.body}</Text>
      <Text style={styles.footnote}>{t('notices.oneWayBroadcast')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 28 },
  categoryPill: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  categoryPillText: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, textTransform: 'capitalize' },
  title: { fontFamily: fonts.serifExtraBold, fontSize: 23, color: colors.text, marginTop: 13, lineHeight: 29 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11 },
  date: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansBold },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  body: { fontSize: 14.5, lineHeight: 26, color: '#26313C' },
  footnote: { fontSize: 12, color: colors.muted, lineHeight: 18, marginTop: 20 },
});
