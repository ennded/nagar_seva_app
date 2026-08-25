import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { CalendarX } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBadge } from '../../components/StatusBadge';
import { WARD_REQUESTS } from '../../graphql/queries/staff.queries';
import type { Appointment, RequestUnion } from '../../graphql/types';
import type { DashboardStackParamList } from '../../navigation/nagarsevakTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<DashboardStackParamList, 'WardAppointments'>;

// N6 — appointment requests raised by citizens in this ward, read-only, with their confirmed
// slot once an officer sets it.
export function NagarsevakAppointmentsScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ wardRequests: RequestUnion[] }>(WARD_REQUESTS, { pollInterval: 30_000 });

  const appointments = useMemo(
    () => (data?.wardRequests ?? []).filter((r): r is Appointment => r.__typename === 'Appointment'),
    [data],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Ward</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Ward Appointments</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.amber} />
        ) : appointments.length === 0 ? (
          <View style={styles.empty}>
            <CalendarX size={30} color={colors.muted} />
            <Text style={styles.emptyText}>No appointments in this ward yet.</Text>
          </View>
        ) : (
          appointments.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardId}>APT-{a.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.cardSlot}>{a.confirmedDate ? `${a.confirmedDate} · ${a.confirmedTimeSlot}` : 'awaiting slot'}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {a.purpose}
              </Text>
              <View style={styles.badgeRow}>
                <StatusBadge status={a.status} />
                <Text style={styles.citizen}>{a.citizen.name}</Text>
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
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.amber },
  backButton: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', marginBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.white },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  empty: { alignItems: 'center', gap: 8, marginTop: 40 },
  emptyText: { fontSize: 13.5, color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, gap: 5 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cardId: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  cardSlot: { fontSize: 11.5, fontFamily: fonts.sansBold, color: colors.muted },
  cardTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, lineHeight: 19 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  citizen: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold },
});
