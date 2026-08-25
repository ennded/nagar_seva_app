import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { Calendar, ChevronRight } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StatusBadge } from '../../components/StatusBadge';
import { NagarsevakHeader } from './NagarsevakHeader';
import { WARD_REQUESTS } from '../../graphql/queries/staff.queries';
import type { Appointment, Complaint, RequestUnion } from '../../graphql/types';
import type { DashboardStackParamList, NagarsevakTabParamList } from '../../navigation/nagarsevakTypes';
import { useAuth } from '../../auth/AuthContext';
import { categoryIcon } from '../../utils/categoryIcon';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<DashboardStackParamList, 'Dashboard'>,
  BottomTabScreenProps<NagarsevakTabParamList>
>;

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

// N3 — four ward-scoped KPI tiles, all honestly computed from wardRequests (no fabricated
// "on schedule" style commentary the mockup shows), then the five most recent ward complaints.
export function NagarsevakDashboardScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { data, loading } = useQuery<{ wardRequests: RequestUnion[] }>(WARD_REQUESTS, { pollInterval: 30_000 });

  const complaints = useMemo(
    () => (data?.wardRequests ?? []).filter((r): r is Complaint => r.__typename === 'Complaint'),
    [data],
  );
  const appointments = useMemo(
    () => (data?.wardRequests ?? []).filter((r): r is Appointment => r.__typename === 'Appointment'),
    [data],
  );

  const kpis = useMemo(() => {
    const openComplaints = complaints.filter((c) => c.status !== 'CLOSED' && c.status !== 'REJECTED').length;
    const resolvedToday = complaints.filter((c) =>
      c.statusHistory.some((h) => (h.status === 'COMPLETED' || h.status === 'CLOSED') && isToday(h.changedAt)),
    ).length;
    const appointmentsToday = appointments.filter((a) => a.confirmedDate && isToday(a.confirmedDate)).length;
    return [
      { value: String(complaints.length), label: 'Total complaints' },
      { value: String(openComplaints), label: 'Open complaints' },
      { value: String(resolvedToday), label: 'Resolved today' },
      { value: String(appointmentsToday), label: 'Appointments today' },
    ];
  }, [complaints, appointments]);

  const latest = useMemo(
    () => [...complaints].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5),
    [complaints],
  );

  function openComplaint(id: string) {
    navigation.navigate('ComplaintsTab', { screen: 'ComplaintDetail', params: { id } });
  }

  return (
    <View style={styles.root}>
      <NagarsevakHeader onBellPress={() => navigation.navigate('Notifications')} />
      {loading && !data ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.amber} />
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <Text style={styles.monitoring}>Monitoring {session?.user.ward?.name ?? 'your ward'}</Text>

          <View style={styles.kpiGrid}>
            {kpis.map((k) => (
              <View key={k.label} style={styles.kpiTile}>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]} onPress={() => navigation.navigate('WardAppointments')}>
            <View style={styles.linkLabelRow}>
              <Calendar size={16} color={colors.text} />
              <Text style={styles.linkLabel}>Ward Appointments</Text>
            </View>
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Latest Complaints</Text>
            <Pressable onPress={() => navigation.navigate('ComplaintsTab', { screen: 'ComplaintsList' })}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>

          {latest.length === 0 ? (
            <Text style={styles.empty}>No complaints in this ward yet.</Text>
          ) : (
            latest.map((c) => (
              <Pressable key={c.id} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => openComplaint(c.id)}>
                <View style={styles.cardIconWrap}>
                  {(() => {
                    const CatIcon = categoryIcon(c.category);
                    return <CatIcon size={18} color={colors.amber} />;
                  })()}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardMeta}>
                    {c.category} · CMP-{c.id.slice(-6).toUpperCase()}
                  </Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {c.title}
                  </Text>
                  <Text style={styles.cardCitizen}>
                    {c.citizen.name} · {c.address}
                  </Text>
                  <View style={styles.badgeRow}>
                    <StatusBadge status={c.status} />
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  monitoring: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansBold },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiTile: { width: '47%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  kpiValue: { fontSize: 26, fontFamily: fonts.serifExtraBold, color: colors.text },
  kpiLabel: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansBold, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 },
  linkRowPressed: { opacity: 0.7 },
  linkLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  linkLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontFamily: fonts.serifExtraBold, color: colors.text },
  viewAll: { fontSize: 13, fontFamily: fonts.sansExtraBold, color: colors.amber },
  empty: { fontSize: 13.5, color: colors.muted, marginTop: 8 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13 },
  cardPressed: { opacity: 0.7 },
  cardIconWrap: { width: 42, height: 42, borderRadius: 11, backgroundColor: colors.amberLight, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted, textTransform: 'capitalize' },
  cardTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 4, lineHeight: 19 },
  cardCitizen: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
});
