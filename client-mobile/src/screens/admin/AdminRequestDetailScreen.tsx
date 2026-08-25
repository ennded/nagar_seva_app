import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { REQUEST_BY_ID, STAFF_BY_CITY } from '../../graphql/queries/staff.queries';
import { DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { VERIFY_REQUEST, ASSIGN_REQUEST, SET_REQUEST_PRIORITY, REVIEW_AND_CLOSE } from '../../graphql/mutations/admin.mutations';
import type { Complaint, DepartmentRef, RequestPriority, RequestUnion, UserFields } from '../../graphql/types';
import type { RequestsStackParamList } from '../../navigation/adminTypes';
import type { RootStackParamList } from '../../navigation/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<RequestsStackParamList, 'RequestDetail'>,
  NativeStackScreenProps<RootStackParamList>
>;

// A6 — the only detail screen in the platform with real write actions: Verify -> Assign
// department -> Assign officer -> Priority (always available) -> Review & Close. The panel shape
// changes with status/type so only the legal action is on screen. Complaints pause at
// ASSIGNED/IN_PROGRESS waiting on the officer's own Start Work/Mark Complete; appointments pause
// at ASSIGNED waiting on the officer's scheduleAppointment call — both hand back to Admin at
// COMPLETED (complaint) / SCHEDULED (appointment) for Review & Close.
export function AdminRequestDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const citySlug = getSavedCitySlug() ?? '';
  const { data, loading } = useQuery<{ request: RequestUnion | null }>(REQUEST_BY_ID, { variables: { id } });
  const { data: deptsData } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, { variables: { citySlug }, skip: !citySlug });
  const [verifyRequest, { loading: verifying }] = useMutation(VERIFY_REQUEST);
  const [assignRequest, { loading: assigning }] = useMutation(ASSIGN_REQUEST);
  const [setPriority, { loading: settingPriority }] = useMutation(SET_REQUEST_PRIORITY);
  const [reviewAndClose, { loading: closing }] = useMutation(REVIEW_AND_CLOSE);

  const [verifyNote, setVerifyNote] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [pickedDeptId, setPickedDeptId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: officersData } = useQuery<{ staffByCity: UserFields[] }>(STAFF_BY_CITY, {
    variables: { role: 'OFFICER' },
    skip: !pickedDeptId,
  });

  const request = data?.request;

  if (loading && !data) {
    return <ActivityIndicator style={{ marginTop: 60 }} color={colors.green} />;
  }
  if (!request) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>This request could not be found.</Text>
      </View>
    );
  }

  const isComplaint = request.__typename === 'Complaint';
  const complaint = isComplaint ? (request as Complaint) : null;
  const photos = complaint?.photos.map((p) => p.url) ?? [];
  const proofPhotos = complaint?.resolutionProof.map((p) => p.url) ?? [];
  const officersInDept = (officersData?.staffByCity ?? []).filter((o) => o.department?.id === pickedDeptId);

  async function handleVerify(approve: boolean) {
    setActionError(null);
    try {
      await verifyRequest({ variables: { id, approve, note: verifyNote || undefined } });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to verify');
    }
  }

  async function handleAssign(officerId: string) {
    if (!pickedDeptId) return;
    setActionError(null);
    try {
      await assignRequest({ variables: { id, departmentId: pickedDeptId, officerId } });
      setPickedDeptId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to assign');
    }
  }

  async function handlePriority(priority: RequestPriority) {
    setActionError(null);
    try {
      await setPriority({ variables: { id, priority } });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to set priority');
    }
  }

  async function handleClose() {
    setActionError(null);
    try {
      await reviewAndClose({ variables: { id, note: closeNote || undefined } });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to close');
    }
  }

  const readyToClose = isComplaint ? request.status === 'COMPLETED' : request.status === 'SCHEDULED';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backLabel}>‹ All Requests</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.meta}>
          {isComplaint ? 'CMP' : 'APT'}-{request.id.slice(-6).toUpperCase()}
          {complaint ? ` · ${complaint.category}` : ''} · {request.ward.name}
        </Text>
        <Text style={styles.title}>{complaint ? complaint.title : (request as { purpose: string }).purpose}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
        </View>
        <View style={styles.detailRows}>
          <DetailRow label="Citizen" value={`${request.citizen.name} · +91 ${request.citizen.mobile}`} />
          {complaint && <DetailRow label="Address" value={complaint.address} />}
          <DetailRow
            label="Assigned"
            value={request.assignedOfficer ? `${request.assignedOfficer.name}${request.department ? ` · ${request.department.name}` : ''}` : '—'}
          />
        </View>
        {complaint && <Text style={styles.description}>{complaint.description}</Text>}
        {photos.length > 0 && (
          <View style={styles.photoRow}>
            {photos.map((url, i) => (
              <Pressable key={url} style={styles.photoThumb} onPress={() => navigation.navigate('PhotoViewer', { urls: photos, startIndex: i })}>
                <Image source={{ uri: url }} style={styles.photoImage} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {actionError && <Text style={styles.actionError}>{actionError}</Text>}

      {request.status === 'REGISTERED' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verify</Text>
          <Text style={styles.cardNote}>Approve to move this to assignment, or reject with a reason.</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.muted}
            value={verifyNote}
            onChangeText={setVerifyNote}
          />
          <View style={styles.actionRow}>
            <Pressable
              disabled={verifying}
              onPress={() => handleVerify(true)}
              style={({ pressed }) => [styles.primaryButton, verifying && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonLabel}>Approve</Text>
            </Pressable>
            <Pressable
              disabled={verifying}
              onPress={() => handleVerify(false)}
              style={({ pressed }) => [styles.rejectButton, verifying && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.rejectLabel}>Reject</Text>
            </Pressable>
          </View>
        </View>
      )}

      {request.status === 'VERIFIED' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assign</Text>
          <Text style={styles.cardNote}>{pickedDeptId ? 'Step 2 of 2 · pick an officer' : 'Step 1 of 2 · pick a department'}</Text>
          {!pickedDeptId ? (
            <View style={{ gap: 9, marginTop: 12 }}>
              {(deptsData?.departmentsByCity ?? []).map((d) => (
                <Pressable key={d.id} onPress={() => setPickedDeptId(d.id)} style={styles.pickRow}>
                  <Text style={styles.pickRowLabel}>{d.name}</Text>
                  <Text style={styles.pickRowChevron}>›</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ gap: 9, marginTop: 12 }}>
              {officersInDept.length === 0 ? (
                <Text style={styles.cardNote}>No officers in this department yet.</Text>
              ) : (
                officersInDept.map((o) => (
                  <Pressable key={o.id} disabled={assigning} onPress={() => handleAssign(o.id)} style={styles.pickRow}>
                    <View style={styles.officerAvatar}>
                      <Text style={styles.officerInitials}>
                        {o.name
                          .split(' ')
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join('')}
                      </Text>
                    </View>
                    <Text style={styles.pickRowLabel}>{o.name}</Text>
                  </Pressable>
                ))
              )}
              <Pressable onPress={() => setPickedDeptId(null)}>
                <Text style={styles.changeDeptLabel}>Change department</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Priority</Text>
        <View style={styles.priorityRow}>
          {(['LOW', 'MEDIUM', 'HIGH'] as RequestPriority[]).map((p) => {
            const active = request.priority === p;
            return (
              <Pressable
                key={p}
                disabled={settingPriority}
                onPress={() => handlePriority(p)}
                style={[styles.priorityButton, active && styles.priorityButtonActive]}
              >
                <Text style={[styles.priorityLabel, active && styles.priorityLabelActive]}>{p.charAt(0) + p.slice(1).toLowerCase()}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {(request.status === 'ASSIGNED' || request.status === 'IN_PROGRESS') && (
        <View style={styles.card}>
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Assigned to {request.assignedOfficer?.name ?? 'an officer'}. The officer{' '}
              {isComplaint ? 'starts work and uploads proof' : 'confirms a date and time slot'}.
            </Text>
          </View>
        </View>
      )}

      {readyToClose && (
        <View style={styles.card}>
          {complaint ? (
            <>
              <Text style={styles.cardTitle}>Resolution from the officer</Text>
              {complaint.resolutionRemarks && <Text style={styles.description}>{complaint.resolutionRemarks}</Text>}
              {proofPhotos.length > 0 && (
                <View style={styles.photoRow}>
                  {proofPhotos.map((url, i) => (
                    <Pressable
                      key={url}
                      style={styles.proofThumb}
                      onPress={() => navigation.navigate('PhotoViewer', { urls: proofPhotos, startIndex: i })}
                    >
                      <Image source={{ uri: url }} style={styles.photoImage} />
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Confirmed schedule</Text>
              <Text style={styles.description}>
                {(request as { confirmedDate?: string | null }).confirmedDate} ·{' '}
                {(request as { confirmedTimeSlot?: string | null }).confirmedTimeSlot}
              </Text>
            </>
          )}
          <Text style={[styles.cardTitle, { marginTop: 16 }]}>Review & Close</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Closing note (optional)"
            placeholderTextColor={colors.muted}
            value={closeNote}
            onChangeText={setCloseNote}
          />
          <Pressable
            disabled={closing}
            onPress={handleClose}
            style={({ pressed }) => [styles.primaryButton, { marginTop: 12 }, closing && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonLabel}>{closing ? 'Closing…' : 'Review & Close'}</Text>
          </Pressable>
        </View>
      )}

      {request.status === 'CLOSED' && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>Closed. The citizen has been notified and can see the resolution.</Text>
        </View>
      )}

      {request.status === 'REJECTED' && (
        <View style={styles.rejectBanner}>
          <Text style={styles.rejectBannerText}>Rejected. The citizen sees your reason on their status screen.</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status history</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {request.statusHistory.map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <StatusBadge status={h.status} />
              <Text style={styles.historyMeta}>
                {new Date(h.changedAt).toLocaleString()} {h.changedBy ? `· ${h.changedBy.name}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, gap: 14 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  backButton: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center' },
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.green },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 4 },
  meta: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  title: { fontSize: 20, fontFamily: fonts.serifExtraBold, color: colors.text, lineHeight: 26, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  detailRows: { gap: 8, marginTop: 12 },
  detailRow: { flexDirection: 'row', gap: 10 },
  detailLabel: { width: 82, fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.muted },
  detailValue: { flex: 1, fontSize: 13.5, fontFamily: fonts.sansSemibold, color: colors.text },
  description: { fontSize: 13.5, lineHeight: 21, color: colors.text, marginTop: 8 },
  photoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  photoThumb: { flex: 1, height: 70, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  proofThumb: { flex: 1, height: 70, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.greenLight, borderWidth: 1, borderColor: colors.border },
  photoImage: { width: '100%', height: '100%' },
  actionError: { color: colors.red, fontSize: 13 },
  cardTitle: { fontSize: 16, fontFamily: fonts.serifExtraBold, color: colors.text },
  cardNote: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 5, lineHeight: 19 },
  noteInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 11, paddingHorizontal: 13, minHeight: 52, fontSize: 13, color: colors.text, marginTop: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryButton: { flex: 1, minHeight: 52, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  rejectButton: { flex: 1, minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  primaryButtonLabel: { color: colors.white, fontSize: 15.5, fontFamily: fonts.sansExtraBold },
  rejectLabel: { color: colors.red, fontSize: 15.5, fontFamily: fonts.sansExtraBold },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 52, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 11, backgroundColor: colors.white },
  pickRowLabel: { flex: 1, fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  pickRowChevron: { fontSize: 18, color: colors.muted, fontFamily: fonts.sansBold },
  officerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.purpleLight, alignItems: 'center', justifyContent: 'center' },
  officerInitials: { fontSize: 12, fontFamily: fonts.sansExtraBold, color: colors.purple },
  changeDeptLabel: { fontSize: 13, fontFamily: fonts.sansExtraBold, color: colors.green, minHeight: 44, textAlignVertical: 'center' },
  priorityRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  priorityButton: { flex: 1, minHeight: 46, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  priorityButtonActive: { backgroundColor: colors.green, borderColor: colors.green },
  priorityLabel: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  priorityLabelActive: { color: colors.white },
  infoBanner: { backgroundColor: colors.infoLight, borderRadius: 10, padding: 12 },
  infoBannerText: { color: colors.info, fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 19 },
  successBanner: { backgroundColor: colors.greenLight, borderRadius: 12, padding: 14 },
  successText: { color: colors.green, fontSize: 13, fontFamily: fonts.sansBold },
  rejectBanner: { backgroundColor: colors.redLight, borderRadius: 12, padding: 14 },
  rejectBannerText: { color: colors.red, fontSize: 13, fontFamily: fonts.sansBold },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, flexShrink: 1 },
});
