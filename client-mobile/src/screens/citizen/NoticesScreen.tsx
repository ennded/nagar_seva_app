import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../auth/AuthContext';
import { ANNOUNCEMENTS } from '../../graphql/queries/public.queries';
import type { Announcement } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notices'>;

const CATEGORIES = ['GENERAL', 'WATER_SUPPLY', 'ROAD_CLOSURE', 'EVENT', 'TAX_REMINDER', 'SCHEME', 'DEVELOPMENT_PROJECT', 'INFRASTRUCTURE'];

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

// S8.1 — eight category filters plus All. Emergency notices stay pinned at the top of every
// filter, in red.
export function NoticesScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { t } = useTranslation();
  const [category, setCategory] = useState<string | null>(null);
  const { data, loading } = useQuery<{ announcements: Announcement[] }>(ANNOUNCEMENTS, {
    variables: { citySlug: session?.citySlug, category: category ?? undefined },
    skip: !session?.citySlug,
  });

  const sorted = useMemo(() => {
    const list = data?.announcements ?? [];
    return [...list].sort((a, b) => {
      if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
      return (b.publishedAt ?? b.createdAt) < (a.publishedAt ?? a.createdAt) ? -1 : 1;
    });
  }, [data]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notices.headerTitle')}</Text>
      </View>
      <View style={styles.chipStrip}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['ALL', ...CATEGORIES]}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => {
            const selected = item === 'ALL' ? category === null : category === item;
            const tone = item !== 'ALL' ? CATEGORY_TONE[item] : null;
            return (
              <Pressable
                style={[styles.chip, selected && { backgroundColor: tone?.color ?? colors.navy, borderColor: tone?.color ?? colors.navy }]}
                onPress={() => setCategory(item === 'ALL' ? null : item)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t(`announcementCategory.${item}`)}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {loading && sorted.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.navy} />
      ) : sorted.length === 0 ? (
        <Text style={styles.empty}>{t('notices.empty')}</Text>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const tone = CATEGORY_TONE[item.category] ?? CATEGORY_TONE.GENERAL;
            return (
              <Pressable style={styles.card} onPress={() => navigation.navigate('NoticeDetail', { announcement: item })}>
                <View style={styles.cardTop}>
                  {item.isEmergency && <AlertTriangle size={15} color={colors.red} />}
                  <View style={[styles.categoryPill, { backgroundColor: item.isEmergency ? colors.redLight : tone.bg }]}>
                    <Text style={[styles.categoryPillText, { color: item.isEmergency ? colors.red : tone.color }]}>
                      {item.isEmergency ? t('announcementCategory.emergency') : t(`announcementCategory.${item.category}`)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.cardDate}>{new Date(item.publishedAt ?? item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody} numberOfLines={2}>
                  {item.body}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 13, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontFamily: fonts.serifExtraBold, fontSize: 19, color: colors.text },
  chipStrip: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 13 },
  chipRow: { paddingHorizontal: 18, gap: 7 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text },
  chipTextSelected: { color: colors.white },
  empty: { padding: 18, color: colors.muted, fontSize: 13 },
  list: { padding: 18, gap: 11 },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  categoryPillText: { fontSize: 11, fontFamily: fonts.sansExtraBold, textTransform: 'capitalize' },
  cardDate: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.sansBold },
  cardTitle: { fontFamily: fonts.serifExtraBold, fontSize: 16, color: colors.text, marginTop: 9, lineHeight: 21 },
  cardBody: { fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 19 },
});
