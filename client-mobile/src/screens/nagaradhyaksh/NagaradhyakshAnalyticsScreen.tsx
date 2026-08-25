import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DASHBOARD_STATS } from '../../graphql/queries/staff.queries';
import type { DashboardStats, RequestStatus } from '../../graphql/types';
import type { ProfileStackParamList } from '../../navigation/nagaradhyakshTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Analytics'>;

// Same tone-per-status mapping as StatusBadge, for a consistent color language.
const FUNNEL_ORDER: RequestStatus[] = ['REGISTERED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];
const FUNNEL_COLOR: Record<RequestStatus, string> = {
  REGISTERED: colors.navy,
  VERIFIED: colors.info,
  ASSIGNED: colors.warning,
  IN_PROGRESS: colors.warning,
  SCHEDULED: colors.info,
  COMPLETED: colors.green,
  CLOSED: colors.green,
  REJECTED: colors.red,
};

// P8 — status funnel only, real data from dashboardStats.byStatus. The mockup's "Monthly trend"
// bar chart is dropped: DashboardStats has no historical/monthly breakdown, and computing one by
// fetching every municipalityRequests page just to bucket by month isn't something I'll build —
// city-wide requests are meant to be paginated (RequestPage exists for a reason), not dumped
// client-side wholesale.
export function NagaradhyakshAnalyticsScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS);

  const funnel = useMemo(() => {
    const byStatus = new Map((data?.dashboardStats.byStatus ?? []).map((s) => [s.status, s.count]));
    const max = Math.max(1, ...FUNNEL_ORDER.map((s) => byStatus.get(s) ?? 0));
    return FUNNEL_ORDER.map((status) => {
      const count = byStatus.get(status) ?? 0;
      return { status, count, width: `${Math.round((count / max) * 100)}%` as DimensionValue };
    });
  }, [data]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Profile</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Complaint Analytics</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.red} />
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status funnel</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {funnel.map((f) => (
                <View key={f.status}>
                  <View style={styles.funnelRow}>
                    <Text style={styles.funnelLabel}>{f.status.replace('_', ' ')}</Text>
                    <Text style={styles.funnelCount}>{f.count}</Text>
                  </View>
                  <View style={styles.funnelTrack}>
                    <View style={[styles.funnelFill, { width: f.width, backgroundColor: FUNNEL_COLOR[f.status] }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
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
  bodyContent: { padding: 18 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  funnelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  funnelLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text, textTransform: 'capitalize' },
  funnelCount: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.muted },
  funnelTrack: { height: 10, borderRadius: 999, backgroundColor: colors.background, marginTop: 5, overflow: 'hidden' },
  funnelFill: { height: '100%', borderRadius: 999 },
});
