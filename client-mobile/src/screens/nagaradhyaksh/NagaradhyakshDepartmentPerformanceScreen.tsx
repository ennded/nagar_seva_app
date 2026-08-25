import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DEPARTMENT_PERFORMANCE } from '../../graphql/queries/staff.queries';
import type { DepartmentPerformance } from '../../graphql/types';
import type { ProfileStackParamList } from '../../navigation/nagaradhyakshTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'DepartmentPerformance'>;

// P7 — one card per department. The mockup shows an "overdue" count in the header, but that
// needs a due-date/SLA concept the schema doesn't have (same gap as Officer's dashboard) — shown
// as resolution rate instead, which departmentPerformance does provide honestly.
export function NagaradhyakshDepartmentPerformanceScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ departmentPerformance: DepartmentPerformance[] }>(DEPARTMENT_PERFORMANCE);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Profile</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Department Performance</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.red} />
        ) : (
          (data?.departmentPerformance ?? []).map((d) => (
            <View key={d.department.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.deptName}>{d.department.name}</Text>
                <Text style={styles.rate}>{d.resolutionRate}% resolved</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{d.totalRequests}</Text>
                  <Text style={styles.statLabel}>Assigned</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{d.resolvedRequests}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{d.avgResolutionDays !== null ? `${d.avgResolutionDays.toFixed(1)} d` : '—'}</Text>
                  <Text style={styles.statLabel}>Avg. close</Text>
                </View>
              </View>
            </View>
          ))
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
  bodyContent: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  deptName: { fontSize: 15, fontFamily: fonts.sansExtraBold, color: colors.text },
  rate: { fontSize: 12.5, fontFamily: fonts.sansExtraBold, color: colors.green },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { flex: 1 },
  statValue: { fontSize: 18, fontFamily: fonts.serifExtraBold, color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, fontFamily: fonts.sansBold },
});
