import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/staff.queries';
import { SCHEDULE_APPOINTMENT } from '../../graphql/mutations/request.mutations';
import type { Appointment, RequestUnion } from '../../graphql/types';
import type { AppointmentsStackParamList } from '../../navigation/officerTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<AppointmentsStackParamList, 'Schedule'>;

const SLOTS = ['9 – 11 am', '11 am – 1 pm', '2 – 4 pm', '4 – 6 pm'];

function nextDays(count: number): { iso: string; dow: string; day: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { iso: d.toISOString().slice(0, 10), dow: d.toLocaleDateString(undefined, { weekday: 'short' }), day: String(d.getDate()) };
  });
}

// O7 — date plus one of the four fixed slots. Confirm stays disabled until both are set.
export function OfficerScheduleScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { data, loading } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS);
  const [scheduleAppointment, { loading: scheduling }] = useMutation(SCHEDULE_APPOINTMENT, {
    refetchQueries: [{ query: MY_ASSIGNED_REQUESTS }],
  });
  const [dateIso, setDateIso] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const dates = useMemo(() => nextDays(4), []);
  const appointment = (data?.myAssignedRequests ?? []).find(
    (r): r is Appointment => r.__typename === 'Appointment' && r.id === id,
  );

  if (loading && !data) {
    return <ActivityIndicator style={{ marginTop: 60 }} color={colors.purple} />;
  }
  if (!appointment) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>This appointment is no longer in your assigned list.</Text>
      </View>
    );
  }

  async function handleConfirm() {
    if (!dateIso || !slot) return;
    setFormError(null);
    try {
      await scheduleAppointment({ variables: { id, confirmedDate: dateIso, confirmedTimeSlot: slot } });
      setScheduled(true);
      setTimeout(() => navigation.goBack(), 900);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to confirm schedule');
    }
  }

  const canConfirm = dateIso !== null && slot !== null;

  return (
    <View style={styles.root}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backLabel}>‹ Appointments</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.meta}>APT-{appointment.id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.title}>{appointment.purpose}</Text>
        <Text style={styles.subtitle}>
          {appointment.citizen.name} · {appointment.ward.name} · requested {new Date(appointment.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Confirm Schedule</Text>
        <Text style={styles.sectionLabel}>Date</Text>
        <View style={styles.dateRow}>
          {dates.map((d) => {
            const active = d.iso === dateIso;
            return (
              <Pressable key={d.iso} onPress={() => setDateIso(d.iso)} style={[styles.dateTile, active && styles.dateTileActive]}>
                <Text style={[styles.dateDow, active && styles.dateTextActive]}>{d.dow}</Text>
                <Text style={[styles.dateDay, active && styles.dateTextActive]}>{d.day}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.sectionLabel}>Time slot</Text>
        <View style={styles.slotGrid}>
          {SLOTS.map((s) => {
            const active = s === slot;
            return (
              <Pressable key={s} onPress={() => setSlot(s)} style={[styles.slotTile, active && styles.slotTileActive]}>
                <Text style={[styles.slotLabel, active && styles.dateTextActive]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>
        {formError && <Text style={styles.error}>{formError}</Text>}
        <Pressable
          disabled={!canConfirm || scheduling}
          onPress={handleConfirm}
          style={({ pressed }) => [styles.confirmButton, (!canConfirm || scheduling) && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.confirmLabel}>{scheduling ? 'Confirming…' : 'Confirm Schedule'}</Text>
        </Pressable>
        {scheduled && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Scheduled. The citizen has been notified and the request is now with the Admin to close.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: 18, gap: 14 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  backButton: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', marginTop: 4 },
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.purple },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  meta: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  title: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.text, marginTop: 5, lineHeight: 25 },
  subtitle: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 8 },
  cardTitle: { fontSize: 16, fontFamily: fonts.sansExtraBold, color: colors.text },
  sectionLabel: { fontSize: 12.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted, marginTop: 14 },
  dateRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  dateTile: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center' },
  dateTileActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  dateDow: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.muted },
  dateDay: { fontSize: 17, fontFamily: fonts.sansExtraBold, color: colors.text, marginTop: 3 },
  dateTextActive: { color: colors.white },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  slotTile: { width: '48%', minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  slotTileActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  slotLabel: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  error: { color: colors.red, fontSize: 13, marginTop: 12 },
  confirmButton: { minHeight: 54, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  confirmLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  successBanner: { backgroundColor: colors.greenLight, borderRadius: 10, padding: 12, marginTop: 12 },
  successText: { color: colors.green, fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 19 },
});
