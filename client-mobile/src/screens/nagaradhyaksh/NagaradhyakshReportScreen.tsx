import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MUNICIPALITY_REQUESTS } from '../../graphql/queries/staff.queries';
import { WARDS_BY_CITY, DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import type { DepartmentRef, RequestSummary, WardRef } from '../../graphql/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { ProfileStackParamList } from '../../navigation/nagaradhyakshTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'CityReport'>;

const PAGE_LIMIT = 200;

// P11 — cut down from the mockup in two real ways: RequestFilter (the server-side filter
// municipalityRequests actually takes) has no date-range param at all, so "From/To" date fields
// are dropped rather than faked. And since municipalityRequests is explicitly paginated (city
// scale, not ward scale), the summary here is computed from the most recent PAGE_LIMIT requests
// matching the filter, not the true city-wide total — labeled as such. "Export as PDF" is
// dropped too, same reason as everywhere else: no PDF/file-save capability exists in this app.
export function NagaradhyakshReportScreen({ navigation }: Props) {
  const citySlug = getSavedCitySlug() ?? '';
  const [wardId, setWardId] = useState<string | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);

  const { data: wardsData } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, { variables: { citySlug }, skip: !citySlug });
  const { data: deptsData } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, { variables: { citySlug }, skip: !citySlug });
  const { data, loading } = useQuery<{ municipalityRequests: { items: RequestSummary[]; total: number } }>(MUNICIPALITY_REQUESTS, {
    variables: { page: 1, limit: PAGE_LIMIT, filter: wardId || departmentId ? { wardId, departmentId } : undefined },
  });

  const items = data?.municipalityRequests.items ?? [];
  const total = data?.municipalityRequests.total ?? 0;
  const closed = items.filter((r) => r.status === 'CLOSED').length;

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of items) {
      const key = r.category ?? 'appointment';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count, pct: Math.round((count / max) * 100) }));
  }, [items]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Profile</Text>
        </Pressable>
        <Text style={styles.headerTitle}>City Report</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.card}>
          <Text style={styles.filterLabel}>Ward</Text>
          <View style={styles.filterRow}>
            <Pressable onPress={() => setWardId(undefined)} style={[styles.pill, !wardId && styles.pillActive]}>
              <Text style={[styles.pillText, !wardId && styles.pillTextActive]}>All wards</Text>
            </Pressable>
            {(wardsData?.wardsByCity ?? []).map((w) => (
              <Pressable key={w.id} onPress={() => setWardId(w.id)} style={[styles.pill, wardId === w.id && styles.pillActive]}>
                <Text style={[styles.pillText, wardId === w.id && styles.pillTextActive]}>{w.name}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Department</Text>
          <View style={styles.filterRow}>
            <Pressable onPress={() => setDepartmentId(undefined)} style={[styles.pill, !departmentId && styles.pillActive]}>
              <Text style={[styles.pillText, !departmentId && styles.pillTextActive]}>All departments</Text>
            </Pressable>
            {(deptsData?.departmentsByCity ?? []).map((d) => (
              <Pressable key={d.id} onPress={() => setDepartmentId(d.id)} style={[styles.pill, departmentId === d.id && styles.pillActive]}>
                <Text style={[styles.pillText, departmentId === d.id && styles.pillTextActive]}>{d.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.red} />
        ) : (
          <>
            <Text style={styles.showingNote}>
              Based on the {items.length} most recent of {total} matching requests.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{items.length}</Text>
                <Text style={styles.statLabel}>Requests shown</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{closed}</Text>
                <Text style={styles.statLabel}>Closed</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>By category</Text>
              <View style={{ gap: 11, marginTop: 12 }}>
                {byCategory.map((b) => (
                  <View key={b.label}>
                    <View style={styles.barRow}>
                      <Text style={styles.barLabel}>{b.label}</Text>
                      <Text style={styles.barCount}>{b.count}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${b.pct}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.red },
  backButton: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', marginBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.white },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  filterLabel: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  pillActive: { backgroundColor: colors.red, borderColor: colors.red },
  pillText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.text },
  pillTextActive: { color: colors.white },
  showingNote: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold },
  statsRow: { flexDirection: 'row', gap: 12 },
  statTile: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  statValue: { fontSize: 24, fontFamily: fonts.serifExtraBold, color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansBold },
  cardTitle: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  barRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text, textTransform: 'capitalize' },
  barCount: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.muted },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: colors.background, marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: colors.red },
});
