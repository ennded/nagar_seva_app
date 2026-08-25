import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { ClipboardList } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { NagarsevakHeader } from './NagarsevakHeader';
import { WARD_REQUESTS } from '../../graphql/queries/staff.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import type { ComplaintsStackParamList, NagarsevakTabParamList } from '../../navigation/nagarsevakTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ComplaintsStackParamList, 'ComplaintsList'>,
  BottomTabScreenProps<NagarsevakTabParamList>
>;

const FILTERS = ['All', 'Registered', 'Assigned', 'In progress', 'Closed'] as const;

function daysOpen(createdAt: string): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000)));
  return days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} open`;
}

// N4 — every complaint in the ward, filterable by status. Read-only list, no assign/close
// controls anywhere (Nagarsevak can only monitor and, on the detail screen, none of the request
// fields — verify/assign/close stay with Admin and Officer).
export function NagarsevakComplaintsListScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ wardRequests: RequestUnion[] }>(WARD_REQUESTS, { pollInterval: 30_000 });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const complaints = useMemo(
    () => (data?.wardRequests ?? []).filter((r): r is Complaint => r.__typename === 'Complaint'),
    [data],
  );

  const filtered = useMemo(() => {
    if (filter === 'Registered') return complaints.filter((c) => c.status === 'REGISTERED');
    if (filter === 'Assigned') return complaints.filter((c) => c.status === 'ASSIGNED');
    if (filter === 'In progress') return complaints.filter((c) => c.status === 'IN_PROGRESS');
    if (filter === 'Closed') return complaints.filter((c) => c.status === 'CLOSED');
    return complaints;
  }, [complaints, filter]);

  return (
    <View style={styles.root}>
      <NagarsevakHeader onBellPress={() => navigation.navigate('DashboardTab', { screen: 'Notifications' })} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.title}>Ward Complaints</Text>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = f === filter;
            const label = f === 'All' ? `All ${complaints.length}` : f;
            return (
              <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterPill, active && styles.filterPillActive]}>
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.amber} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <ClipboardList size={30} color={colors.muted} />
            <Text style={styles.emptyText}>No complaints in this ward match the filter.</Text>
          </View>
        ) : (
          filtered.map((c) => (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('ComplaintDetail', { id: c.id })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardId}>CMP-{c.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.cardAge}>{daysOpen(c.createdAt)}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {c.title}
              </Text>
              <Text style={styles.cardAddress}>{c.address}</Text>
              <View style={styles.badgeRow}>
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  title: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.text },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filterPillActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  filterLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text },
  filterLabelActive: { color: colors.white },
  empty: { alignItems: 'center', gap: 8, marginTop: 40 },
  emptyText: { fontSize: 13.5, color: colors.muted, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, gap: 5 },
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardId: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  cardAge: { fontSize: 11.5, fontFamily: fonts.sansBold, color: colors.muted },
  cardTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, lineHeight: 19 },
  cardAddress: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
});
