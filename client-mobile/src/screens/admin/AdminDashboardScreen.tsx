import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Inbox, ChevronRight } from 'lucide-react-native';
import { AdminHeader } from './AdminHeader';
import { DASHBOARD_STATS } from '../../graphql/queries/staff.queries';
import type { AdminTabParamList, DashboardStackParamList } from '../../navigation/adminTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<DashboardStackParamList, 'Dashboard'>,
  BottomTabScreenProps<AdminTabParamList>
>;

const STATUS_ORDER: { status: string; label: string; color: string }[] = [
  { status: 'REGISTERED', label: 'Registered', color: colors.muted },
  { status: 'VERIFIED', label: 'Verified', color: colors.info },
  { status: 'ASSIGNED', label: 'Assigned', color: colors.info },
  { status: 'IN_PROGRESS', label: 'In progress', color: colors.warning },
  { status: 'COMPLETED', label: 'Completed', color: colors.green },
  { status: 'CLOSED', label: 'Closed', color: colors.green },
];

const BREAKDOWN_COLORS = [colors.green, colors.info, colors.orange, colors.purple, colors.cyan, colors.red];
type BreakdownKey = 'Department' | 'Ward' | 'Category' | 'Priority';

// A3 — six city-wide snapshot tiles, the verification queue as the one primary action, a
// by-status bar list, and a breakdown that switches between Department/Ward/Category/Priority.
// Every figure is real, straight from dashboardStats.
export function AdminDashboardScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{
    dashboardStats: {
      totalRequests: number;
      totalComplaints: number;
      openComplaints: number;
      resolvedToday: number;
      resolutionRate: number;
      pendingAppointments: number;
      completedAppointments: number;
      byStatus: { status: string; count: number }[];
      byCategory: { category: string; count: number }[];
      byDepartment: { department: { id: string; name: string }; count: number }[];
      byWard: { ward: { id: string; name: string }; count: number }[];
      byPriority: { priority: string; count: number }[];
    };
  }>(DASHBOARD_STATS, { pollInterval: 30_000 });
  const [breakdown, setBreakdown] = useState<BreakdownKey>('Department');

  const stats = data?.dashboardStats;
  const registeredCount = stats?.byStatus.find((s) => s.status === 'REGISTERED')?.count ?? 0;

  const kpis = stats
    ? [
        { value: String(stats.totalRequests), label: 'Total requests' },
        { value: String(stats.totalComplaints), label: 'Total complaints' },
        { value: String(stats.openComplaints), label: 'Open complaints' },
        { value: String(stats.resolvedToday), label: 'Resolved today' },
        { value: `${stats.resolutionRate}%`, label: 'Resolution rate' },
        { value: String(registeredCount), label: 'Awaiting verification' },
      ]
    : [];

  const statusRows = useMemo(() => {
    if (!stats) return [];
    const byStatus = new Map(stats.byStatus.map((s) => [s.status, s.count]));
    const max = Math.max(1, ...STATUS_ORDER.map((s) => byStatus.get(s.status) ?? 0));
    return STATUS_ORDER.map((s) => ({ ...s, count: byStatus.get(s.status) ?? 0, pct: Math.round(((byStatus.get(s.status) ?? 0) / max) * 100) }));
  }, [stats]);

  const breakdownRows = useMemo(() => {
    if (!stats) return [];
    const raw =
      breakdown === 'Department'
        ? stats.byDepartment.map((b) => ({ label: b.department.name, count: b.count }))
        : breakdown === 'Ward'
          ? stats.byWard.map((b) => ({ label: b.ward.name, count: b.count }))
          : breakdown === 'Category'
            ? stats.byCategory.map((b) => ({ label: b.category, count: b.count }))
            : stats.byPriority.map((b) => ({ label: b.priority, count: b.count }));
    const max = Math.max(1, ...raw.map((r) => r.count));
    return [...raw]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((r, i) => ({ ...r, pct: Math.round((r.count / max) * 100), color: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }));
  }, [stats, breakdown]);

  return (
    <View style={styles.root}>
      <AdminHeader onBellPress={() => navigation.navigate('Notifications')} />
      {loading && !stats ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.green} />
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.kpiGrid}>
            {kpis.map((k) => (
              <View key={k.label} style={styles.kpiTile}>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={() => navigation.navigate('Pending')} style={styles.pendingCta}>
            <Inbox size={23} color={colors.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Pending Requests</Text>
              <Text style={styles.pendingSubtitle}>{registeredCount} waiting on your verification</Text>
            </View>
            <ChevronRight size={18} color={colors.white} />
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>By status</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {statusRows.map((r) => (
                <View key={r.status}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowLabel}>{r.label}</Text>
                    <Text style={styles.rowCount}>{r.count}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${r.pct}%`, backgroundColor: r.color }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.tabRow}>
              {(['Department', 'Ward', 'Category', 'Priority'] as BreakdownKey[]).map((b) => {
                const active = b === breakdown;
                return (
                  <Pressable key={b} onPress={() => setBreakdown(b)} style={[styles.tabPill, active && styles.tabPillActive]}>
                    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{b}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ gap: 10, marginTop: 14 }}>
              {breakdownRows.map((r) => (
                <View key={r.label} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel} numberOfLines={1}>
                    {r.label}
                  </Text>
                  <View style={styles.breakdownTrack}>
                    <View style={[styles.breakdownFill, { width: `${r.pct}%`, backgroundColor: r.color }]} />
                  </View>
                  <Text style={styles.breakdownCount}>{r.count}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{stats?.pendingAppointments ?? 0}</Text>
              <Text style={styles.statLabel}>Pending appointments</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{stats?.completedAppointments ?? 0}</Text>
              <Text style={styles.statLabel}>Completed appointments</Text>
            </View>
          </View>
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
  kpiValue: { fontSize: 25, fontFamily: fonts.serifExtraBold, color: colors.text },
  kpiLabel: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansBold, marginTop: 2 },
  pendingCta: { backgroundColor: colors.green, borderRadius: 16, padding: 16, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingTitle: { fontSize: 16.5, fontFamily: fonts.sansExtraBold, color: colors.white },
  pendingSubtitle: { fontSize: 12.5, color: 'rgba(255,255,255,0.9)', marginTop: 3 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text },
  rowCount: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.muted },
  track: { height: 9, borderRadius: 999, backgroundColor: colors.background, marginTop: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabPill: { flex: 1, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center' },
  tabPillActive: { backgroundColor: colors.green, borderColor: colors.green },
  tabLabel: { fontSize: 12, fontFamily: fonts.sansExtraBold, color: colors.text },
  tabLabelActive: { color: colors.white },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, width: 104, flexShrink: 0 },
  breakdownTrack: { flex: 1, height: 9, borderRadius: 999, backgroundColor: colors.background, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 999 },
  breakdownCount: { fontSize: 12, fontFamily: fonts.sansExtraBold, color: colors.muted, width: 32, textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statTile: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  statValue: { fontSize: 24, fontFamily: fonts.serifExtraBold, color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansBold, marginTop: 2 },
});
