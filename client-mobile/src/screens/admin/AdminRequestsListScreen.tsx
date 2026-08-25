import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { ClipboardList } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { AdminHeader } from './AdminHeader';
import { ALL_REQUESTS } from '../../graphql/queries/staff.queries';
import type { RequestSummary, RequestStatus } from '../../graphql/types';
import type { AdminTabParamList, RequestsStackParamList } from '../../navigation/adminTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<RequestsStackParamList, 'RequestsList'>,
  BottomTabScreenProps<AdminTabParamList>
>;

const FILTERS: { label: string; status: RequestStatus | null }[] = [
  { label: 'All', status: null },
  { label: 'Registered', status: 'REGISTERED' },
  { label: 'Verified', status: 'VERIFIED' },
  { label: 'Assigned', status: 'ASSIGNED' },
  { label: 'In progress', status: 'IN_PROGRESS' },
  { label: 'Completed', status: 'COMPLETED' },
  { label: 'Closed', status: 'CLOSED' },
];

const PAGE_LIMIT = 20;

// A5 — every request in the city, filterable by status, genuinely paginated (allRequests takes
// page/limit server-side, unlike the other roles' simplified "most recent N" lists).
export function AdminRequestsListScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<RequestStatus | null>(null);
  const [page, setPage] = useState(1);

  const { data, loading } = useQuery<{ allRequests: { items: RequestSummary[]; total: number; page: number; limit: number } }>(
    ALL_REQUESTS,
    { variables: { page, limit: PAGE_LIMIT, filter: filter ? { status: filter } : undefined }, pollInterval: 30_000 },
  );

  const items = data?.allRequests.items ?? [];
  const total = data?.allRequests.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  function selectFilter(status: RequestStatus | null) {
    setFilter(status);
    setPage(1);
  }

  return (
    <View style={styles.root}>
      <AdminHeader onBellPress={() => navigation.navigate('DashboardTab', { screen: 'Notifications' })} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.title}>All Requests</Text>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = f.status === filter;
            return (
              <Pressable key={f.label} onPress={() => selectFilter(f.status)} style={[styles.filterPill, active && styles.filterPillActive]}>
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.green} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <ClipboardList size={30} color={colors.muted} />
            <Text style={styles.emptyText}>No requests with this status.</Text>
          </View>
        ) : (
          <>
            {items.map((r) => (
              <Pressable
                key={r.id}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate('RequestDetail', { id: r.id })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardId}>
                    {r.type === 'COMPLAINT' ? 'CMP' : 'APT'}-{r.id.slice(-6).toUpperCase()}
                  </Text>
                  <Text style={styles.cardWard}>{r.ward.name}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {r.title ?? r.purpose}
                </Text>
                <View style={styles.badgeRow}>
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                  {r.department && <Text style={styles.dept}>{r.department.name}</Text>}
                </View>
              </Pressable>
            ))}
            <View style={styles.pagerRow}>
              <Pressable
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={[styles.pagerButton, page <= 1 && styles.pagerButtonDisabled]}
              >
                <Text style={[styles.pagerLabel, page <= 1 && styles.pagerLabelDisabled]}>Previous</Text>
              </Pressable>
              <Text style={styles.pagerCount}>
                Page {page} of {totalPages}
              </Text>
              <Pressable
                disabled={page >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={[styles.pagerButton, styles.pagerButtonNext, page >= totalPages && styles.pagerButtonDisabled]}
              >
                <Text style={[styles.pagerLabel, styles.pagerLabelNext, page >= totalPages && styles.pagerLabelDisabled]}>Next</Text>
              </Pressable>
            </View>
          </>
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
  filterPillActive: { backgroundColor: colors.green, borderColor: colors.green },
  filterLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text },
  filterLabelActive: { color: colors.white },
  empty: { alignItems: 'center', gap: 8, marginTop: 40 },
  emptyText: { fontSize: 13.5, color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, gap: 5, marginBottom: 12 },
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardId: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  cardWard: { fontSize: 11.5, fontFamily: fonts.sansBold, color: colors.muted },
  cardTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, lineHeight: 19 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  dept: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold },
  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pagerButton: { flex: 1, minHeight: 46, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  pagerButtonNext: { borderColor: colors.green },
  pagerButtonDisabled: { opacity: 0.5 },
  pagerLabel: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  pagerLabelNext: { color: colors.green },
  pagerLabelDisabled: {},
  pagerCount: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.muted },
});
