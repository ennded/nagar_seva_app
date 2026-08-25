import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/staff.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import type { ProfileStackParamList } from '../../navigation/officerTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Performance'>;

// O9 — personal history behind the dashboard tiles. Only two stats: resolved count and average
// resolution time, both computed from real statusHistory timestamps. The mockup's "on-time rate"
// 6-week trend chart is dropped — the schema has no due-date/SLA concept to derive it from
// honestly, and myAssignedRequests returns every request ever assigned to this officer (no
// separate performance endpoint exists), so a fabricated trend would just be decoration.
export function OfficerPerformanceScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS);

  const stats = useMemo(() => {
    const complaints = (data?.myAssignedRequests ?? []).filter((r): r is Complaint => r.__typename === 'Complaint');
    const resolved = complaints.filter((c) => c.status === 'COMPLETED' || c.status === 'CLOSED');

    const durations: number[] = [];
    for (const c of resolved) {
      const assignedAt = c.statusHistory.find((h) => h.status === 'ASSIGNED')?.changedAt;
      const completedAt = c.statusHistory.find((h) => h.status === 'COMPLETED')?.changedAt;
      if (assignedAt && completedAt) {
        durations.push((new Date(completedAt).getTime() - new Date(assignedAt).getTime()) / (24 * 60 * 60 * 1000));
      }
    }
    const avgDays = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

    return { resolvedCount: resolved.length, avgDays };
  }, [data]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Performance</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.purple} />
        ) : (
          <View style={styles.grid}>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>{stats.resolvedCount}</Text>
              <Text style={styles.tileLabel}>Resolved all time</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>{stats.avgDays !== null ? `${stats.avgDays.toFixed(1)} d` : '—'}</Text>
              <Text style={styles.tileLabel}>Avg. resolution</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.purple },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18 },
  grid: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  tileValue: { fontSize: 26, fontFamily: fonts.serifExtraBold, color: colors.text },
  tileLabel: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansBold, marginTop: 2 },
});
