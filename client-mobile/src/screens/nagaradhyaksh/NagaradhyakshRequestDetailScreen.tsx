import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { REQUEST_BY_ID } from '../../graphql/queries/staff.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import type { RequestsStackParamList } from '../../navigation/nagaradhyakshTypes';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<RequestsStackParamList, 'RequestDetail'>,
  NativeStackScreenProps<RootStackParamList>
>;

// P5 — read-only, same shape as the Nagarsevak's detail screen. The mockup shows Priority as
// editable here too, but setRequestPriority is admin-only server-side — same deviation as
// Nagarsevak's detail screen, shown read-only instead of as tappable buttons.
export function NagaradhyakshRequestDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { data, loading } = useQuery<{ request: RequestUnion | null }>(REQUEST_BY_ID, { variables: { id } });
  const request = data?.request;

  if (loading && !data) {
    return <ActivityIndicator style={{ marginTop: 60 }} color={colors.red} />;
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
          <DetailRow label="Citizen" value={request.citizen.name} />
          {complaint && <DetailRow label="Address" value={complaint.address} />}
          <DetailRow label="Department" value={request.department?.name ?? 'Not yet assigned'} />
          <DetailRow label="Officer" value={request.assignedOfficer?.name ?? 'Not yet assigned'} />
        </View>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Priority</Text>
        <Text style={styles.cardNote}>Priority is set by the Municipal Admin.</Text>
        <View style={{ marginTop: 10 }}>
          <PriorityBadge priority={request.priority} />
        </View>
      </View>

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

      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>Read-only — no verify, assign or close controls for this office.</Text>
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
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.red },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 4 },
  meta: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  title: { fontSize: 20, fontFamily: fonts.serifExtraBold, color: colors.text, lineHeight: 26, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  detailRows: { gap: 8, marginTop: 12 },
  detailRow: { flexDirection: 'row', gap: 10 },
  detailLabel: { width: 88, fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.muted },
  detailValue: { flex: 1, fontSize: 13.5, fontFamily: fonts.sansSemibold, color: colors.text },
  photoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  photoThumb: { flex: 1, height: 70, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  photoImage: { width: '100%', height: '100%' },
  cardTitle: { fontSize: 16, fontFamily: fonts.serifExtraBold, color: colors.text },
  cardNote: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 5, lineHeight: 19 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, flexShrink: 1 },
  infoBanner: { backgroundColor: colors.infoLight, borderRadius: 12, padding: 14 },
  infoBannerText: { color: colors.info, fontSize: 13, fontFamily: fonts.sansBold },
});
