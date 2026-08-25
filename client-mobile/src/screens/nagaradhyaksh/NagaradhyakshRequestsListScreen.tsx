import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { ClipboardList } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { NagaradhyakshHeader } from './NagaradhyakshHeader';
import { MUNICIPALITY_REQUESTS } from '../../graphql/queries/staff.queries';
import { WARDS_BY_CITY } from '../../graphql/queries/public.queries';
import type { RequestSummary, WardRef } from '../../graphql/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { NagaradhyakshTabParamList, RequestsStackParamList } from '../../navigation/nagaradhyakshTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<RequestsStackParamList, 'RequestsList'>,
  BottomTabScreenProps<NagaradhyakshTabParamList>
>;

const PAGE_LIMIT = 50;

// P4 — every request in the city with a real ward filter (RequestFilter.wardId, server-side).
export function NagaradhyakshRequestsListScreen({ route, navigation }: Props) {
  const citySlug = getSavedCitySlug() ?? '';
  const [wardId, setWardId] = useState<string | undefined>(route.params?.wardId);

  const { data: wardsData } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, { variables: { citySlug }, skip: !citySlug });
  const { data, loading } = useQuery<{ municipalityRequests: { items: RequestSummary[]; total: number } }>(
    MUNICIPALITY_REQUESTS,
    { variables: { page: 1, limit: PAGE_LIMIT, filter: wardId ? { wardId } : undefined }, pollInterval: 30_000 },
  );

  const wards = wardsData?.wardsByCity ?? [];
  const items = data?.municipalityRequests.items ?? [];
  const total = data?.municipalityRequests.total ?? 0;

  return (
    <View style={styles.root}>
      <NagaradhyakshHeader onBellPress={() => navigation.navigate('OverviewTab', { screen: 'Notifications' })} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.title}>All Requests</Text>
        <View style={styles.filterRow}>
          <Pressable onPress={() => setWardId(undefined)} style={[styles.filterPill, !wardId && styles.filterPillActive]}>
            <Text style={[styles.filterLabel, !wardId && styles.filterLabelActive]}>All wards</Text>
          </Pressable>
          {wards.map((w) => {
            const active = w.id === wardId;
            return (
              <Pressable key={w.id} onPress={() => setWardId(w.id)} style={[styles.filterPill, active && styles.filterPillActive]}>
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{w.name}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.red} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <ClipboardList size={30} color={colors.muted} />
            <Text style={styles.emptyText}>No requests match this filter.</Text>
          </View>
        ) : (
          <>
            {total > PAGE_LIMIT && (
              <Text style={styles.showingNote}>
                Showing the {PAGE_LIMIT} most recent of {total}.
              </Text>
            )}
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
  filterPillActive: { backgroundColor: colors.red, borderColor: colors.red },
  filterLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text },
  filterLabelActive: { color: colors.white },
  showingNote: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold },
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
});
