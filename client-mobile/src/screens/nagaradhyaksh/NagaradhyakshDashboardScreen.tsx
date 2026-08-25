import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useQuery } from '@apollo/client';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StatusBadge } from '../../components/StatusBadge';
import { NagaradhyakshHeader } from './NagaradhyakshHeader';
import { DASHBOARD_STATS, DEPARTMENT_PERFORMANCE, MUNICIPALITY_REQUESTS } from '../../graphql/queries/staff.queries';
import type { DashboardStats, DepartmentPerformance, RequestSummary } from '../../graphql/types';
import type { NagaradhyakshTabParamList, OverviewStackParamList } from '../../navigation/nagaradhyakshTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<OverviewStackParamList, 'Overview'>,
  BottomTabScreenProps<NagaradhyakshTabParamList>
>;

// P3 — city-wide KPI tiles, requests by category, and recent activity across every ward. Every
// figure is real: totals/open/resolved-today come from dashboardStats, avg. resolution is
// averaged from departmentPerformance's per-department avgResolutionDays (no single city-wide
// avg field exists on DashboardStats itself), and recent activity is the 5 newest
// municipalityRequests.
export function NagaradhyakshDashboardScreen({ navigation }: Props) {
  const { data: statsData, loading: statsLoading } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS, {
    pollInterval: 30_000,
  });
  const { data: deptData } = useQuery<{ departmentPerformance: DepartmentPerformance[] }>(DEPARTMENT_PERFORMANCE);
  const { data: activityData, loading: activityLoading } = useQuery<{
    municipalityRequests: { items: RequestSummary[] };
  }>(MUNICIPALITY_REQUESTS, { variables: { page: 1, limit: 5 } });

  const stats = statsData?.dashboardStats;

  const avgResolutionDays = useMemo(() => {
    const values = (deptData?.departmentPerformance ?? [])
      .map((d) => d.avgResolutionDays)
      .filter((v): v is number => v != null);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [deptData]);

  const categoryBars = useMemo(() => {
    const cats = stats?.byCategory ?? [];
    const max = Math.max(1, ...cats.map((c) => c.count));
    return [...cats]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((c) => ({ ...c, height: `${Math.max(6, Math.round((c.count / max) * 100))}%` as DimensionValue }));
  }, [stats]);

  const activity = activityData?.municipalityRequests.items ?? [];

  return (
    <View style={styles.root}>
      <NagaradhyakshHeader onBellPress={() => navigation.navigate('Notifications')} />
      {statsLoading && !stats ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.red} />
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiTile}>
              <Text style={styles.kpiValue}>{stats?.totalRequests ?? 0}</Text>
              <Text style={styles.kpiLabel}>Total requests</Text>
            </View>
            <View style={styles.kpiTile}>
              <Text style={styles.kpiValue}>{(stats?.openComplaints ?? 0) + (stats?.pendingAppointments ?? 0)}</Text>
              <Text style={styles.kpiLabel}>Open city-wide</Text>
            </View>
            <View style={styles.kpiTile}>
              <Text style={styles.kpiValue}>{stats?.resolvedToday ?? 0}</Text>
              <Text style={styles.kpiLabel}>Resolved today</Text>
            </View>
            <View style={styles.kpiTile}>
              <Text style={styles.kpiValue}>{avgResolutionDays !== null ? `${avgResolutionDays.toFixed(1)} d` : '—'}</Text>
              <Text style={styles.kpiLabel}>Avg. resolution</Text>
            </View>
          </View>

          {categoryBars.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Requests by category</Text>
              <View style={styles.barsRow}>
                {categoryBars.map((c) => (
                  <View key={c.category} style={styles.barCol}>
                    <Text style={styles.barValue}>{c.count}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: c.height }]} />
                    </View>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {c.category}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Recent activity</Text>
          {activityLoading && activity.length === 0 ? (
            <ActivityIndicator color={colors.red} />
          ) : (
            activity.map((r) => (
              <Pressable
                key={r.id}
                style={({ pressed }) => [styles.activityCard, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate('RequestsTab', { screen: 'RequestDetail', params: { id: r.id } })}
              >
                <View style={styles.activityTop}>
                  <Text style={styles.activityMeta}>
                    {r.ward.name} · {r.type === 'COMPLAINT' ? 'CMP' : 'APT'}-{r.id.slice(-6).toUpperCase()}
                  </Text>
                  <Text style={styles.activityMeta}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.activityTitle} numberOfLines={2}>
                  {r.title ?? r.purpose}
                </Text>
                <View style={{ marginTop: 8 }}>
                  <StatusBadge status={r.status} />
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiTile: { width: '47%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  kpiValue: { fontSize: 26, fontFamily: fonts.serifExtraBold, color: colors.text },
  kpiLabel: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansBold, marginTop: 2 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 130, marginTop: 14 },
  barCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 10.5, fontFamily: fonts.sansExtraBold },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: colors.red, borderRadius: 5 },
  barLabel: { fontSize: 9.5, color: colors.muted, fontFamily: fonts.sansBold, textTransform: 'capitalize' },
  sectionTitle: { fontSize: 18, fontFamily: fonts.serifExtraBold, color: colors.text, marginTop: 4 },
  activityCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13 },
  cardPressed: { opacity: 0.7 },
  activityTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  activityMeta: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  activityTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 5, lineHeight: 19 },
});
