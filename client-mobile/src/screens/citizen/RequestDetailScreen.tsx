import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, MapPin, CheckCircle2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { REQUEST_DETAIL } from '../../graphql/queries/request.queries';
import type { Complaint, RequestStatus, RequestUnion } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestDetail'>;

const RESOLVED_STATUSES = ['COMPLETED', 'CLOSED'];

const STATUS_TONE: Record<RequestStatus, { bg: string; color: string; dot: string }> = {
  REGISTERED: { bg: colors.navyLight, color: colors.navy, dot: colors.navy },
  VERIFIED: { bg: '#EAF0F9', color: '#1D4ED8', dot: '#1D4ED8' },
  ASSIGNED: { bg: '#EAF0F9', color: '#1D4ED8', dot: '#1D4ED8' },
  IN_PROGRESS: { bg: '#EAF0F9', color: '#1D4ED8', dot: '#1D4ED8' },
  SCHEDULED: { bg: '#EAF0F9', color: '#1D4ED8', dot: '#1D4ED8' },
  COMPLETED: { bg: colors.greenLight, color: colors.green, dot: colors.green },
  CLOSED: { bg: colors.greenLight, color: colors.green, dot: colors.green },
  REJECTED: { bg: colors.redLight, color: colors.red, dot: colors.red },
};

// S7.1 (complaint, in progress) / S7.2 (complaint, resolved + proof) / S7.4 (appointment,
// scheduled) — one screen, since all three are read-only detail views distinguished only by
// which sections have data. Terminal by design: no action buttons anywhere on this screen.
export function RequestDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ request: RequestUnion | null }>(REQUEST_DETAIL, {
    variables: { id: route.params.id },
  });
  const request = data?.request;

  if (loading && !request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }
  if (!request) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('requestDetail.notFound')}</Text>
      </View>
    );
  }

  const isComplaint = request.__typename === 'Complaint';
  const complaint = isComplaint ? (request as Complaint) : null;
  const resolved = RESOLVED_STATUSES.includes(request.status);
  const tone = STATUS_TONE[request.status];

  function openPhotos(urls: string[], startIndex: number) {
    navigation.navigate('PhotoViewer', { urls, startIndex });
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.headTop}>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.statusPillText, { color: tone.color }]}>{t(`status.${request.status}`)}</Text>
          </View>
          <Text style={styles.idText}>{request.id.slice(-8).toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{isComplaint ? complaint!.title : request.purpose}</Text>
        <Text style={styles.meta}>
          {request.type === 'COMPLAINT' ? complaint!.category : t('requestDetail.appointment')} · {new Date(request.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* S7.4 — the confirmed slot is the one fact an appointment citizen came for. */}
      {!isComplaint && request.confirmedDate && (
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <CalendarCheck size={17} color={colors.navy} />
            <Text style={styles.scheduleKicker}>{t('requestDetail.confirmedAppointment')}</Text>
          </View>
          <Text style={styles.scheduleValue}>
            {new Date(request.confirmedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
            {request.confirmedTimeSlot}
          </Text>
        </View>
      )}

      {(isComplaint ? complaint!.description : request.remarks) && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{isComplaint ? t('requestDetail.description') : t('requestDetail.remarks')}</Text>
          <Text style={styles.cardBody}>{isComplaint ? complaint!.description : request.remarks}</Text>
          {isComplaint && (
            <View style={styles.addressRow}>
              <MapPin size={17} color={colors.muted} />
              <Text style={styles.addressText}>{complaint!.address}</Text>
            </View>
          )}
        </View>
      )}

      {isComplaint && complaint!.photos.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('requestDetail.evidencePhotos')}</Text>
          <View style={styles.photoRow}>
            {complaint!.photos.map((p, i) => (
              <Pressable
                key={p.url}
                style={styles.photoCell}
                onPress={() => openPhotos(complaint!.photos.map((ph) => ph.url), i)}
              >
                <Image source={{ uri: p.url }} style={styles.photoImage} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* S7.2 — the Resolution card is the payoff; nothing follows it. */}
      {isComplaint && resolved && complaint!.resolutionProof.length > 0 && (
        <View style={styles.resolutionCard}>
          <View style={styles.scheduleHeader}>
            <CheckCircle2 size={17} color={colors.green} />
            <Text style={styles.resolutionKicker}>{t('requestDetail.resolution')}</Text>
          </View>
          {complaint!.resolutionRemarks && <Text style={styles.resolutionBody}>{complaint!.resolutionRemarks}</Text>}
          <View style={styles.photoRow}>
            {complaint!.resolutionProof.map((p, i) => (
              <Pressable
                key={p.url}
                style={styles.resolutionPhotoCell}
                onPress={() => openPhotos(complaint!.resolutionProof.map((ph) => ph.url), i)}
              >
                <Image source={{ uri: p.url }} style={styles.photoImage} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('requestDetail.statusHistory')}</Text>
        <View style={styles.timeline}>
          {request.statusHistory.map((event, i) => {
            const isLast = i === request.statusHistory.length - 1;
            const eventTone = STATUS_TONE[event.status];
            return (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, { backgroundColor: eventTone.dot }]} />
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={[styles.timelineBody, !isLast && styles.timelineBodyPad]}>
                  <Text style={[styles.timelineStatus, { color: eventTone.color }]}>{t(`status.${event.status}`)}</Text>
                  <Text style={styles.timelineDate}>{new Date(event.changedAt).toLocaleString()}</Text>
                  {event.note && <Text style={styles.timelineNote}>{event.note}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {request.assignedOfficer && (
        <View style={styles.officerCard}>
          <View style={styles.officerAvatar}>
            <Text style={styles.officerInitial}>{request.assignedOfficer.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>{t('requestDetail.assignedOfficer')}</Text>
            <Text style={styles.officerName}>{request.assignedOfficer.name}</Text>
            {request.department && <Text style={styles.officerDept}>{request.department.name}</Text>}
          </View>
        </View>
      )}

      <Text style={styles.footnote}>{t('requestDetail.footnote')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, gap: 13, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  notFound: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  headTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusPill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontSize: 11.5, fontFamily: fonts.sansExtraBold },
  idText: { fontSize: 11.5, fontFamily: fonts.sansBold, color: colors.muted },
  title: { fontFamily: fonts.serifExtraBold, fontSize: 20, color: colors.text, marginTop: 11, lineHeight: 26 },
  meta: { fontSize: 12.5, color: colors.muted, marginTop: 8, fontFamily: fonts.sansSemibold, textTransform: 'capitalize' },
  scheduleCard: { backgroundColor: colors.navyLight, borderWidth: 1, borderColor: '#C7D6E3', borderRadius: 16, padding: 16 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleKicker: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.navy },
  scheduleValue: { fontFamily: fonts.serifExtraBold, fontSize: 19, color: colors.navy, marginTop: 9 },
  cardLabel: { fontSize: 11, fontFamily: fonts.sansExtraBold, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.muted },
  cardBody: { fontSize: 14, lineHeight: 21, color: colors.text, marginTop: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 13, paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.border },
  addressText: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.text, flex: 1, lineHeight: 19 },
  photoRow: { flexDirection: 'row', gap: 9, marginTop: 11 },
  photoCell: { flex: 1, aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  photoImage: { width: '100%', height: '100%' },
  resolutionCard: { backgroundColor: '#F1F9F4', borderWidth: 1, borderColor: '#C4E4D3', borderRadius: 16, padding: 16 },
  resolutionKicker: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, letterSpacing: 0.4, textTransform: 'uppercase', color: '#146848' },
  resolutionBody: { fontSize: 14, lineHeight: 21, color: '#183A2C', marginTop: 9 },
  resolutionPhotoCell: { flex: 1, aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.greenLight, borderWidth: 1, borderColor: '#C4E4D3' },
  timeline: { marginTop: 13 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineRail: { alignItems: 'center', width: 14 },
  timelineDot: { width: 11, height: 11, borderRadius: 6, marginTop: 4 },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, minHeight: 24 },
  timelineBody: { flex: 1 },
  timelineBodyPad: { paddingBottom: 16 },
  timelineStatus: { fontSize: 13.5, fontFamily: fonts.sansExtraBold },
  timelineDate: { fontSize: 12, color: colors.muted, marginTop: 3, fontFamily: fonts.sansBold },
  timelineNote: { fontSize: 12.5, color: '#3A4450', marginTop: 5, lineHeight: 18 },
  officerCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  officerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.purpleLight, alignItems: 'center', justifyContent: 'center' },
  officerInitial: { fontFamily: fonts.serifExtraBold, fontSize: 15, color: colors.purple },
  officerName: { fontSize: 14.5, fontFamily: fonts.sansExtraBold, color: colors.text, marginTop: 4 },
  officerDept: { fontSize: 12, color: colors.muted, marginTop: 2 },
  footnote: { fontSize: 12, color: colors.muted, lineHeight: 18, textAlign: 'center', paddingHorizontal: 8 },
});
