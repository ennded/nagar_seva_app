import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { ClipboardList } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { OfficerHeader } from './OfficerHeader';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/staff.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import type { ComplaintsStackParamList, OfficerTabParamList } from '../../navigation/officerTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ComplaintsStackParamList, 'ComplaintsList'>,
  BottomTabScreenProps<OfficerTabParamList>
>;

const FILTERS = ['All', 'Assigned', 'In progress', 'Completed'] as const;

// O4 — every complaint assigned to this officer, filterable by status. Filtering to Completed
// with none yet done shows the empty state.
export function OfficerComplaintsListScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS, {
    pollInterval: 30_000,
  });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const complaints = useMemo(
    () => (data?.myAssignedRequests ?? []).filter((r): r is Complaint => r.__typename === 'Complaint'),
    [data],
  );

  const filtered = useMemo(() => {
    if (filter === 'Assigned') return complaints.filter((c) => c.status === 'ASSIGNED');
    if (filter === 'In progress') return complaints.filter((c) => c.status === 'IN_PROGRESS');
    if (filter === 'Completed') return complaints.filter((c) => c.status === 'COMPLETED' || c.status === 'CLOSED');
    return complaints;
  }, [complaints, filter]);

  return (
    <View style={styles.root}>
      <OfficerHeader onBellPress={() => navigation.navigate('AlertsTab')} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.title}>My Complaints</Text>
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
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.purple} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <ClipboardList size={30} color={colors.muted} />
            <Text style={styles.emptyText}>No complaints match this filter.</Text>
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
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {c.title}
              </Text>
              <View style={styles.badgeRow}>
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
                <Text style={styles.ward}>{c.ward.name}</Text>
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
  filterPillActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  filterLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text },
  filterLabelActive: { color: colors.white },
  empty: { alignItems: 'center', gap: 8, marginTop: 40 },
  emptyText: { fontSize: 13.5, color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, gap: 5 },
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardId: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  cardTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, lineHeight: 19 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  ward: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold },
});
