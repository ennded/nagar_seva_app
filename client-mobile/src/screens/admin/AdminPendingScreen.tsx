import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import { CheckCircle2 } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { PENDING_REQUESTS } from '../../graphql/queries/staff.queries';
import { VERIFY_REQUEST } from '../../graphql/mutations/admin.mutations';
import type { RequestSummary } from '../../graphql/types';
import type { AdminTabParamList, DashboardStackParamList } from '../../navigation/adminTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<DashboardStackParamList, 'Pending'>,
  BottomTabScreenProps<AdminTabParamList>
>;

// A4 — the verification queue. Verify or Reject with a note, right on the card — nothing moves
// on to assignment until this happens.
export function AdminPendingScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ pendingRequests: RequestSummary[] }>(PENDING_REQUESTS, { pollInterval: 20_000 });
  const [verifyRequest] = useMutation(VERIFY_REQUEST, { refetchQueries: [{ query: PENDING_REQUESTS }] });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = data?.pendingRequests ?? [];

  async function handleDecision(id: string, approve: boolean) {
    setBusyId(id);
    try {
      await verifyRequest({ variables: { id, approve, note: notes[id] || undefined } });
      navigation.navigate('RequestsTab', { screen: 'RequestDetail', params: { id } });
    } catch {
      // Refetch already re-syncs the queue either way.
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={styles.root}>
      <AdminHeaderStrip onBack={() => navigation.goBack()} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Pending Requests</Text>
          <Text style={styles.count}>{rows.length} registered</Text>
        </View>
        <Text style={styles.subtitle}>
          Nothing moves until you verify it. Approve to send it on for assignment, or reject with a reason the citizen
          will see.
        </Text>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.green} />
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <CheckCircle2 size={30} color={colors.muted} />
            <Text style={styles.emptyText}>Nothing waiting on verification.</Text>
          </View>
        ) : (
          rows.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardId}>
                  {r.type === 'COMPLAINT' ? 'CMP' : 'APT'}-{r.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={styles.cardWard}>{r.ward.name}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {r.title ?? r.purpose}
              </Text>
              <Text style={styles.cardMeta}>
                {r.category ?? 'Appointment'} · {r.citizen.name}
              </Text>
              <View style={styles.badgeRow}>
                <PriorityBadge priority={r.priority} />
                <StatusBadge status="REGISTERED" />
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note (optional)"
                placeholderTextColor={colors.muted}
                value={notes[r.id] ?? ''}
                onChangeText={(t) => setNotes((n) => ({ ...n, [r.id]: t }))}
              />
              <View style={styles.actionRow}>
                <Pressable
                  disabled={busyId === r.id}
                  onPress={() => handleDecision(r.id, true)}
                  style={({ pressed }) => [styles.verifyButton, busyId === r.id && styles.disabled, pressed && styles.pressed]}
                >
                  <Text style={styles.verifyLabel}>Verify</Text>
                </Pressable>
                <Pressable
                  disabled={busyId === r.id}
                  onPress={() => handleDecision(r.id, false)}
                  style={({ pressed }) => [styles.rejectButton, busyId === r.id && styles.disabled, pressed && styles.pressed]}
                >
                  <Text style={styles.rejectLabel}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function AdminHeaderStrip({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.headerStrip}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backLabel}>‹ Dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerStrip: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 10, backgroundColor: colors.green },
  backButton: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.text },
  count: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansBold },
  subtitle: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, lineHeight: 19 },
  empty: { alignItems: 'center', gap: 8, marginTop: 40 },
  emptyText: { fontSize: 13.5, color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardId: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  cardWard: { fontSize: 11.5, fontFamily: fonts.sansBold, color: colors.muted },
  cardTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 5, lineHeight: 19 },
  cardMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  noteInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 11, paddingHorizontal: 13, minHeight: 44, fontSize: 13, color: colors.text, marginTop: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 11 },
  verifyButton: { flex: 1, minHeight: 48, borderRadius: 11, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  rejectButton: { flex: 1, minHeight: 48, borderRadius: 11, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  verifyLabel: { color: colors.white, fontSize: 14.5, fontFamily: fonts.sansExtraBold },
  rejectLabel: { color: colors.red, fontSize: 14.5, fontFamily: fonts.sansExtraBold },
});
