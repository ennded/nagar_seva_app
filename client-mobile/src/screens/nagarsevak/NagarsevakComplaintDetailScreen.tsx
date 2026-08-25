import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { WARD_REQUESTS } from '../../graphql/queries/staff.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import type { ComplaintsStackParamList } from '../../navigation/nagarsevakTypes';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ComplaintsStackParamList, 'ComplaintDetail'>,
  NativeStackScreenProps<RootStackParamList>
>;

// N5 — read-only detail. The mockup shows Priority as an editable field for this role, but
// setRequestPriority is admin-only server-side (requireRole(ctx, ['admin']) in
// request.resolvers.ts) — calling it as Nagarsevak would just fail every time, so Priority is
// shown read-only here like every other field, not as tappable options.
export function NagarsevakComplaintDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { data, loading } = useQuery<{ wardRequests: RequestUnion[] }>(WARD_REQUESTS);

  const complaint = (data?.wardRequests ?? []).find(
    (r): r is Complaint => r.__typename === 'Complaint' && r.id === id,
  );

  if (loading && !data) {
    return <ActivityIndicator style={{ marginTop: 60 }} color={colors.amber} />;
  }
  if (!complaint) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>This complaint is no longer in your ward's list.</Text>
      </View>
    );
  }

  const photos = complaint.photos.map((p) => p.url);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backLabel}>‹ Ward Complaints</Text>
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
          <DetailRow label="Citizen" value={complaint.citizen.name} />
          <DetailRow label="Address" value={complaint.address} />
          <DetailRow label="Officer" value={complaint.assignedOfficer ? `${complaint.assignedOfficer.name}${complaint.department ? ` · ${complaint.department.name}` : ''}` : 'Not yet assigned'} />
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
          <PriorityBadge priority={complaint.priority} />
        </View>
      </View>

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

      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>Read-only — verify, assign and close stay with the Admin and Officer.</Text>
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
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.amber },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 4 },
  meta: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted },
  title: { fontSize: 20, fontFamily: fonts.serifExtraBold, color: colors.text, lineHeight: 26, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  detailRows: { gap: 8, marginTop: 12 },
  detailRow: { flexDirection: 'row', gap: 10 },
  detailLabel: { width: 78, fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.muted },
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
