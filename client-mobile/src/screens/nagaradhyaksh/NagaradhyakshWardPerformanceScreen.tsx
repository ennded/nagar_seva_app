import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { WARD_PERFORMANCE } from '../../graphql/queries/staff.queries';
import type { WardPerformance } from '../../graphql/types';
import type { NagaradhyakshTabParamList } from '../../navigation/nagaradhyakshTypes';
import { colors, fonts } from '../../theme';

type Props = BottomTabScreenProps<NagaradhyakshTabParamList, 'WardsTab'>;

function rateColor(pct: number): string {
  if (pct >= 75) return colors.green;
  if (pct >= 50) return colors.orange;
  return colors.red;
}

// P6 — one row per ward, sorted by resolution rate; real data from wardPerformance. Tapping a
// ward opens the Requests tab pre-filtered to it.
export function NagaradhyakshWardPerformanceScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ wardPerformance: WardPerformance[] }>(WARD_PERFORMANCE);

  const rows = [...(data?.wardPerformance ?? [])].sort((a, b) => b.resolutionRate - a.resolutionRate);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ward Performance</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.subtitle}>Sorted by resolution rate. Tap a ward to see its requests.</Text>
        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.red} />
        ) : (
          rows.map((w) => (
            <Pressable
              key={w.ward.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('RequestsTab', { screen: 'RequestsList', params: { wardId: w.ward.id } })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.wardName}>{w.ward.name}</Text>
                <Text style={[styles.pct, { color: rateColor(w.resolutionRate) }]}>{w.resolutionRate}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${w.resolutionRate}%`, backgroundColor: rateColor(w.resolutionRate) }]} />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{w.totalComplaints} total</Text>
                <Text style={styles.metaText}>{w.pending} open</Text>
                <Text style={styles.metaText}>avg {w.avgResolutionDays !== null ? `${w.avgResolutionDays.toFixed(1)} d` : '—'}</Text>
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
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.red },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  subtitle: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  wardName: { fontSize: 15, fontFamily: fonts.sansExtraBold, color: colors.text },
  pct: { fontSize: 15, fontFamily: fonts.sansExtraBold },
  track: { height: 8, borderRadius: 999, backgroundColor: colors.background, marginTop: 9, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  metaRow: { flexDirection: 'row', gap: 14, marginTop: 10 },
  metaText: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.sansBold },
});
