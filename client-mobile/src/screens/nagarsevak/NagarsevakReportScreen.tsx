import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WARD_REQUESTS } from '../../graphql/queries/staff.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import type { ProfileStackParamList } from '../../navigation/nagarsevakTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'WardReport'>;

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'All time', days: null },
] as const;

// N9 — the Admin report screen scoped to this ward, computed from real wardRequests data.
// Two changes from the mockup: date range is a preset picker instead of free date fields (no
// date-picker component is wired up), and the "Export as PDF" button is dropped — there's no PDF
// generation or file-save capability in this app, so a working export isn't something I can wire
// up without adding a whole new capability; a button that did nothing would just be decoration.
export function NagarsevakReportScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ wardRequests: RequestUnion[] }>(WARD_REQUESTS);
  const [rangeIdx, setRangeIdx] = useState(1);

  const complaints = useMemo(
    () => (data?.wardRequests ?? []).filter((r): r is Complaint => r.__typename === 'Complaint'),
    [data],
  );

  const inRange = useMemo(() => {
    const days = RANGES[rangeIdx].days;
    if (days === null) return complaints;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return complaints.filter((c) => new Date(c.createdAt).getTime() >= cutoff);
  }, [complaints, rangeIdx]);

  const registered = inRange.length;
  const closed = inRange.filter((c) => c.status === 'CLOSED').length;

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of inRange) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    const max = Math.max(1, ...counts.values());
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count, width: `${Math.round((count / max) * 100)}%` as DimensionValue }));
  }, [inRange]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Profile</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Ward Report</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.rangeRow}>
          {RANGES.map((r, i) => {
            const active = i === rangeIdx;
            return (
              <Pressable key={r.label} onPress={() => setRangeIdx(i)} style={[styles.rangePill, active && styles.rangePillActive]}>
                <Text style={[styles.rangeLabel, active && styles.rangeLabelActive]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.amber} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{registered}</Text>
                <Text style={styles.statLabel}>Registered</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{closed}</Text>
                <Text style={styles.statLabel}>Closed</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>By category</Text>
              {byCategory.length === 0 ? (
                <Text style={styles.emptyText}>No complaints in this range.</Text>
              ) : (
                <View style={{ gap: 11, marginTop: 12 }}>
                  {byCategory.map((b) => (
                    <View key={b.label}>
                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>{b.label}</Text>
                        <Text style={styles.barCount}>{b.count}</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: b.width }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.amber },
  backButton: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', marginBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.white },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  rangeRow: { flexDirection: 'row', gap: 8 },
  rangePill: { flex: 1, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center' },
  rangePillActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  rangeLabel: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.text },
  rangeLabelActive: { color: colors.white },
  statsRow: { flexDirection: 'row', gap: 12 },
  statTile: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  statValue: { fontSize: 24, fontFamily: fonts.serifExtraBold, color: colors.text },
  statLabel: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansBold },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  emptyText: { fontSize: 13, color: colors.muted, marginTop: 10 },
  barRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text, textTransform: 'capitalize' },
  barCount: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.muted },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: colors.background, marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: colors.amber },
});
