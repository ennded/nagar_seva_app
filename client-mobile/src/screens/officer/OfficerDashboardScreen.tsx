import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { OfficerHeader } from './OfficerHeader';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/staff.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import type { OfficerTabParamList } from '../../navigation/officerTypes';
import { categoryIcon } from '../../utils/categoryIcon';
import { colors, fonts } from '../../theme';

type Props = BottomTabScreenProps<OfficerTabParamList, 'DashboardTab'>;

const PRIORITY_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// O3 — four KPI tiles, all computed honestly from myAssignedRequests (no fabricated "overdue" /
// on-time-rate figures — the schema has no due-date or SLA concept to back those with).
export function OfficerDashboardScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS, {
    pollInterval: 30_000,
  });

  const complaints = useMemo(
    () => (data?.myAssignedRequests ?? []).filter((r): r is Complaint => r.__typename === 'Complaint'),
    [data],
  );

  const kpis = useMemo(() => {
    const assigned = data?.myAssignedRequests ?? [];
    const pending = assigned.filter((r) => r.status === 'ASSIGNED').length;
    const inProgress = assigned.filter((r) => r.status === 'IN_PROGRESS').length;
    const highPriority = assigned.filter((r) => r.priority === 'HIGH').length;
    const resolvedThisWeek = complaints.filter((c) =>
      c.statusHistory.some((h) => h.status === 'COMPLETED' && Date.now() - new Date(h.changedAt).getTime() < WEEK_MS),
    ).length;
    return [
      { value: String(assigned.length), label: 'Assigned to me', insight: highPriority > 0 ? `${highPriority} high priority` : null, tone: colors.warning },
      { value: String(pending), label: 'Pending action', insight: null, tone: colors.warning },
      { value: String(inProgress), label: 'In progress', insight: null, tone: colors.purple },
      { value: String(resolvedThisWeek), label: 'Resolved this week', insight: null, tone: colors.green },
    ];
  }, [data, complaints]);

  const needsAction = useMemo(
    () =>
      [...complaints]
        .filter((c) => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS')
        .sort((a, b) => {
          const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
          return p !== 0 ? p : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        })
        .slice(0, 5),
    [complaints],
  );

  function openComplaint(id: string) {
    navigation.navigate('ComplaintsTab', { screen: 'ComplaintDetail', params: { id } });
  }

  return (
    <View style={styles.root}>
      <OfficerHeader onBellPress={() => navigation.navigate('AlertsTab')} />
      {loading && !data ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.purple} />
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.kpiGrid}>
            {kpis.map((k) => (
              <View key={k.label} style={styles.kpiTile}>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
                {k.insight && <Text style={[styles.kpiInsight, { color: k.tone }]}>{k.insight}</Text>}
              </View>
            ))}
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Needs Action</Text>
            <Pressable onPress={() => navigation.navigate('ComplaintsTab', { screen: 'ComplaintsList' })}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>

          {needsAction.length === 0 ? (
            <Text style={styles.empty}>Nothing needs action right now.</Text>
          ) : (
            needsAction.map((c) => (
              <Pressable key={c.id} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => openComplaint(c.id)}>
                <View style={styles.cardIconWrap}>
                  {(() => {
                    const CatIcon = categoryIcon(c.category);
                    return <CatIcon size={18} color={colors.purple} />;
                  })()}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardMeta}>
                    {c.category} · CMP-{c.id.slice(-6).toUpperCase()}
                  </Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {c.title}
                  </Text>
                  <Text style={styles.cardCitizen}>
                    {c.citizen.name} · {c.ward.name}
                  </Text>
                  <View style={styles.badgeRow}>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </View>
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
  kpiInsight: { fontSize: 11.5, fontFamily: fonts.sansBold, marginTop: 7 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontFamily: fonts.serifExtraBold, color: colors.text },
  viewAll: { fontSize: 13, fontFamily: fonts.sansExtraBold, color: colors.purple },
  empty: { fontSize: 13.5, color: colors.muted, marginTop: 8 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13 },
  cardPressed: { opacity: 0.7 },
  cardIconWrap: { width: 42, height: 42, borderRadius: 11, backgroundColor: colors.purpleLight, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted, textTransform: 'capitalize' },
  cardTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 4, lineHeight: 19 },
  cardCitizen: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
});
