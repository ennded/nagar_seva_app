import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import { Check, Camera } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/staff.queries';
import { START_WORK, COMPLETE_COMPLAINT } from '../../graphql/mutations/request.mutations';
import { uploadComplaintPhoto } from '../../apollo/upload';
import type { Complaint, RequestUnion } from '../../graphql/types';
import type { ComplaintsStackParamList } from '../../navigation/officerTypes';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ComplaintsStackParamList, 'ComplaintDetail'>,
  NativeStackScreenProps<RootStackParamList>
>;

// O5 — read panels plus one action panel that changes with status: Start Work → proof
// upload (Mark Complete disabled + "Proof required" until a file exists) → waiting on Admin.
export function OfficerComplaintDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { data, loading } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS);
  const [startWork, { loading: starting }] = useMutation(START_WORK);
  const [completeComplaint, { loading: completing }] = useMutation(COMPLETE_COMPLAINT);
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');
  const [uploading, setUploading] = useState(false);
  const [proofMissingError, setProofMissingError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const complaint = (data?.myAssignedRequests ?? []).find(
    (r): r is Complaint => r.__typename === 'Complaint' && r.id === id,
  );

  if (loading && !data) {
    return <ActivityIndicator style={{ marginTop: 60 }} color={colors.purple} />;
  }
  if (!complaint) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>This complaint is no longer in your assigned list.</Text>
      </View>
    );
  }

  const photos = complaint.photos.map((p) => p.url);

  async function addProof() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setActionError('Photo library permission is required to attach proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    setActionError(null);
    try {
      const url = await uploadComplaintPhoto({ uri: asset.uri, name: asset.fileName ?? 'proof.jpg', type: asset.mimeType ?? 'image/jpeg' });
      setProofUrls((prev) => [...prev, url]);
      setProofMissingError(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const complaintId = complaint.id;

  async function handleStartWork() {
    setActionError(null);
    try {
      await startWork({ variables: { id: complaintId } });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start work');
    }
  }

  async function handleMarkComplete() {
    if (proofUrls.length === 0) {
      setProofMissingError(true);
      return;
    }
    setActionError(null);
    try {
      await completeComplaint({ variables: { id: complaintId, resolutionProofUrls: proofUrls, remarks: remarks || null } });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark complete');
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backLabel}>‹ My Complaints</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.meta}>
          CMP-{complaint.id.slice(-6).toUpperCase()} · {complaint.category}
        </Text>
        <Text style={styles.title}>{complaint.title}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
        </View>
        <View style={styles.detailRows}>
          <DetailRow label="Citizen" value={`${complaint.citizen.name} · +91 ${complaint.citizen.mobile}`} />
          <DetailRow label="Ward" value={complaint.ward.name} />
          <DetailRow label="Address" value={complaint.address} />
        </View>
        <Text style={styles.description}>{complaint.description}</Text>
        {photos.length > 0 && (
          <View style={styles.photoRow}>
            {photos.map((url, i) => (
              <Pressable
                key={url}
                style={styles.photoThumb}
                onPress={() => navigation.navigate('PhotoViewer', { urls: photos, startIndex: i })}
              >
                <Image source={{ uri: url }} style={styles.photoImage} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {actionError && <Text style={styles.actionError}>{actionError}</Text>}

      {complaint.status === 'ASSIGNED' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your action</Text>
          <Text style={styles.cardNote}>Starting work tells the citizen you are on site and starts the resolution clock.</Text>
          <Pressable
            disabled={starting}
            onPress={handleStartWork}
            style={({ pressed }) => [styles.primaryButton, starting && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonLabel}>{starting ? 'Starting…' : 'Start Work'}</Text>
          </Pressable>
        </View>
      )}

      {complaint.status === 'IN_PROGRESS' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mark Complete</Text>
          <Text style={styles.sectionLabel}>Resolution proof</Text>
          <View style={styles.proofRow}>
            {proofUrls.map((url) => (
              <View key={url} style={styles.proofChip}>
                <Check size={14} color={colors.green} />
                <Text style={styles.proofChipText}>Attached</Text>
              </View>
            ))}
            <Pressable disabled={uploading} onPress={addProof} style={styles.addProofButton}>
              {!uploading && <Camera size={14} color={colors.purple} />}
              <Text style={styles.addProofLabel}>{uploading ? 'Uploading…' : 'Add photo'}</Text>
            </Pressable>
          </View>
          {proofMissingError && <Text style={styles.actionError}>Proof required — attach at least one photo.</Text>}
          <Text style={styles.sectionLabel}>Remarks</Text>
          <TextInput
            style={styles.remarksInput}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Add remarks (optional)"
            placeholderTextColor={colors.muted}
            multiline
          />
          <Pressable
            disabled={completing}
            onPress={handleMarkComplete}
            style={({ pressed }) => [styles.successButton, (completing || proofUrls.length === 0) && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonLabel}>{completing ? 'Submitting…' : 'Mark Complete'}</Text>
          </Pressable>
        </View>
      )}

      {(complaint.status === 'COMPLETED' || complaint.status === 'CLOSED') && (
        <View style={styles.card}>
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              {complaint.status === 'COMPLETED'
                ? 'Waiting on Admin review. Nothing more to do here.'
                : 'Closed by the Admin.'}
            </Text>
          </View>
          <Text style={styles.cardNote}>
            The Admin reviews your proof and closes the request. The citizen sees your resolution photo on their status screen.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status history</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {complaint.statusHistory.map((h, i) => (
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
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.purple },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 4 },
  meta: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  title: { fontSize: 20, fontFamily: fonts.serifExtraBold, color: colors.text, lineHeight: 26, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  detailRows: { gap: 8, marginTop: 12 },
  detailRow: { flexDirection: 'row', gap: 10 },
  detailLabel: { width: 78, fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.muted },
  detailValue: { flex: 1, fontSize: 13.5, fontFamily: fonts.sansSemibold, color: colors.text },
  description: { fontSize: 13.5, lineHeight: 21, color: colors.text, marginTop: 12 },
  photoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  photoThumb: { flex: 1, height: 70, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  photoImage: { width: '100%', height: '100%' },
  actionError: { color: colors.red, fontSize: 13 },
  cardTitle: { fontSize: 16, fontFamily: fonts.serifExtraBold, color: colors.text },
  cardNote: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 5, lineHeight: 19 },
  primaryButton: { minHeight: 54, borderRadius: 12, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  successButton: { minHeight: 54, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  primaryButtonLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  sectionLabel: { fontSize: 12.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted, marginTop: 14 },
  proofRow: { flexDirection: 'row', gap: 10, marginTop: 9 },
  proofChip: { flex: 1, height: 74, borderRadius: 12, backgroundColor: colors.greenLight, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 5 },
  proofChipText: { fontSize: 11, fontFamily: fonts.sansExtraBold, color: colors.green },
  addProofButton: { flex: 1, height: 74, borderRadius: 12, borderWidth: 1, borderColor: colors.purple, borderStyle: 'dashed', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 5 },
  addProofLabel: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.purple, textAlign: 'center' },
  remarksInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 12, padding: 12, marginTop: 8, fontSize: 13.5, lineHeight: 20, color: colors.text, minHeight: 62, textAlignVertical: 'top' },
  infoBanner: { backgroundColor: colors.infoLight, borderRadius: 10, padding: 12 },
  infoBannerText: { color: colors.info, fontSize: 13, fontFamily: fonts.sansBold },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, flexShrink: 1 },
});
