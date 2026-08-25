import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { CalendarX } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StatusBadge } from '../../components/StatusBadge';
import { OfficerHeader } from './OfficerHeader';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/staff.queries';
import type { Appointment, RequestUnion } from '../../graphql/types';
import type { AppointmentsStackParamList, OfficerTabParamList } from '../../navigation/officerTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<AppointmentsStackParamList, 'AppointmentsList'>,
  BottomTabScreenProps<OfficerTabParamList>
>;

// O6 — appointments assigned by the Admin. Only ASSIGNED ones (awaiting a confirmed slot) are
// tappable to schedule; SCHEDULED/CLOSED ones are shown read-only since scheduleAppointment is a
// one-way transition (ASSIGNED -> SCHEDULED only, per shared/enums APPOINTMENT_TRANSITIONS).
export function OfficerAppointmentsListScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS, {
    pollInterval: 30_000,
  });

  const appointments = useMemo(
    () => (data?.myAssignedRequests ?? []).filter((r): r is Appointment => r.__typename === 'Appointment'),
    [data],
  );

  return (
    <View style={styles.root}>
      <OfficerHeader onBellPress={() => navigation.navigate('AlertsTab')} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.title}>Appointments</Text>
        <Text style={styles.subtitle}>Assigned to you by the Admin. Confirm a date and one of the four fixed slots.</Text>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.purple} />
        ) : appointments.length === 0 ? (
          <View style={styles.empty}>
            <CalendarX size={30} color={colors.muted} />
            <Text style={styles.emptyText}>No appointments assigned yet.</Text>
          </View>
        ) : (
          appointments.map((a) => {
            const schedulable = a.status === 'ASSIGNED';
            return (
              <Pressable
                key={a.id}
                disabled={!schedulable}
                style={({ pressed }) => [styles.card, !schedulable && styles.cardReadOnly, pressed && schedulable && styles.cardPressed]}
                onPress={() => schedulable && navigation.navigate('Schedule', { id: a.id })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardId}>APT-{a.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.cardDate}>
                    {a.confirmedDate ? `${a.confirmedDate} · ${a.confirmedTimeSlot}` : `requested ${new Date(a.createdAt).toLocaleDateString()}`}
                  </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {a.purpose}
                </Text>
                <View style={styles.badgeRow}>
                  <StatusBadge status={a.status} />
                  <Text style={styles.citizen}>{a.citizen.name}</Text>
                </View>
              </Pressable>
            );
          })
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
  subtitle: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, lineHeight: 19 },
  empty: { alignItems: 'center', gap: 8, marginTop: 40 },
  emptyText: { fontSize: 13.5, color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, gap: 5 },
  cardReadOnly: { opacity: 0.75 },
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cardId: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  cardDate: { fontSize: 11.5, fontFamily: fonts.sansBold, color: colors.muted },
  cardTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, lineHeight: 19 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  citizen: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold },
});
