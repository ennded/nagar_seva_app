import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, SlidersHorizontal, ArrowDown, Inbox, CalendarX } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import type { Complaint, RequestStatus, RequestType, RequestUnion } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MyRequests'>;

const STATUSES: RequestStatus[] = ['REGISTERED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'SCHEDULED', 'COMPLETED', 'CLOSED', 'REJECTED'];

const STATUS_TONE: Record<RequestStatus, { bg: string; color: string }> = {
  REGISTERED: { bg: colors.navyLight, color: colors.navy },
  VERIFIED: { bg: '#EAF0F9', color: '#1D4ED8' },
  ASSIGNED: { bg: '#EAF0F9', color: '#1D4ED8' },
  IN_PROGRESS: { bg: '#EAF0F9', color: '#1D4ED8' },
  SCHEDULED: { bg: '#EAF0F9', color: '#1D4ED8' },
  COMPLETED: { bg: colors.greenLight, color: colors.green },
  CLOSED: { bg: colors.greenLight, color: colors.green },
  REJECTED: { bg: colors.redLight, color: colors.red },
};

// S6.1–S6.4 — Complaints/Appointments segmented tabs, a status filter sheet, and a distinct
// empty state per tab (or per filter, when a filter matches nothing).
export function MyRequestsScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<RequestType>(route.params?.initialTab ?? 'COMPLAINT');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, loading, refetch } = useQuery<{ myRequests: RequestUnion[] }>(MY_REQUESTS, {
    variables: { status: statusFilter ?? undefined },
  });

  const requests = useMemo(() => (data?.myRequests ?? []).filter((r) => r.type === tab), [data, tab]);

  const emptyIcon = tab === 'APPOINTMENT' ? CalendarX : Inbox;
  const emptyTitle = statusFilter
    ? t(tab === 'COMPLAINT' ? 'myRequests.emptyFilteredComplaints' : 'myRequests.emptyFilteredAppointments')
    : t(tab === 'APPOINTMENT' ? 'myRequests.emptyNoAppointments' : 'myRequests.emptyNoComplaints');
  const emptyBody = statusFilter
    ? t(tab === 'COMPLAINT' ? 'myRequests.emptyBodyFilteredComplaints' : 'myRequests.emptyBodyFilteredAppointments', {
        status: t(`status.${statusFilter}`),
      })
    : t(tab === 'APPOINTMENT' ? 'myRequests.emptyBodyNoAppointments' : 'myRequests.emptyBodyNoComplaints');
  const emptyCta = statusFilter
    ? t('myRequests.clearFilter')
    : t(tab === 'APPOINTMENT' ? 'myRequests.bookAppointment' : 'myRequests.reportComplaint');

  function handleEmptyAction() {
    if (statusFilter) {
      setStatusFilter(null);
      return;
    }
    navigation.navigate(tab === 'COMPLAINT' ? 'ComplaintWizard' : 'AppointmentWizard');
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={21} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('myRequests.headerTitle')}</Text>
        <Pressable onPress={() => setFilterOpen(true)} style={styles.filterButton}>
          <SlidersHorizontal size={15} color={colors.white} />
          <Text style={styles.filterButtonText}>{statusFilter ? t(`status.${statusFilter}`) : t('myRequests.filter')}</Text>
        </Pressable>
      </View>

      <View style={styles.tabStrip}>
        <Pressable style={[styles.tab, tab === 'COMPLAINT' && styles.tabActive]} onPress={() => setTab('COMPLAINT')}>
          <Text style={[styles.tabText, tab === 'COMPLAINT' && styles.tabTextActive]}>{t('myRequests.complaints')}</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'APPOINTMENT' && styles.tabActive]} onPress={() => setTab('APPOINTMENT')}>
          <Text style={[styles.tabText, tab === 'APPOINTMENT' && styles.tabTextActive]}>{t('myRequests.appointments')}</Text>
        </Pressable>
      </View>
      <View style={styles.pullHint}>
        <ArrowDown size={14} color={colors.muted} />
        <Text style={styles.pullHintText}>{t('myRequests.pullToRefresh')}</Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            {emptyIcon === Inbox ? <Inbox size={30} color={colors.muted} /> : <CalendarX size={30} color={colors.muted} />}
          </View>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyBody}>{emptyBody}</Text>
          <Pressable style={styles.emptyCta} onPress={handleEmptyAction}>
            <Text style={styles.emptyCtaLabel}>{emptyCta}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={() => refetch()}
          renderItem={({ item }) => {
            const tone = STATUS_TONE[item.status];
            return (
              <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={() => navigation.navigate('RequestDetail', { id: item.id })}>
                <View style={styles.rowTop}>
                  <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusPillText, { color: tone.color }]}>{t(`status.${item.status}`)}</Text>
                  </View>
                  <Text style={styles.rowId}>{item.id.slice(-8).toUpperCase()}</Text>
                </View>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.__typename === 'Complaint' ? (item as Complaint).title : item.purpose}
                </Text>
                <Text style={styles.rowMeta}>
                  {item.ward.name} · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={filterOpen} animationType="slide" transparent onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t('myRequests.filterByStatus')}</Text>
          <View style={styles.chipRow}>
            {STATUSES.map((s) => {
              const selected = statusFilter === s;
              return (
                <Pressable key={s} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setStatusFilter(selected ? null : s)}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t(`status.${s}`)}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={styles.sheetButton} onPress={() => setFilterOpen(false)}>
            <Text style={styles.sheetButtonLabel}>{t('myRequests.showResults')}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 10, paddingBottom: 14, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backButton: { padding: 10, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: fonts.serifExtraBold, fontSize: 19, color: colors.white, paddingHorizontal: 4 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 10, paddingHorizontal: 12, minHeight: 40, marginRight: 6 },
  filterButtonText: { color: colors.white, fontSize: 13, fontFamily: fonts.sansExtraBold, textTransform: 'capitalize' },
  tabStrip: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 4, marginHorizontal: 18, marginTop: 14 },
  tab: { flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  tabActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  tabText: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.muted },
  tabTextActive: { color: colors.navy },
  pullHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11 },
  pullHintText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.muted },
  empty: { padding: 26, alignItems: 'center', gap: 13, marginTop: 20 },
  emptyIconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.serifExtraBold, fontSize: 19, color: colors.text, textAlign: 'center' },
  emptyBody: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  emptyCta: { minHeight: 48, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.navy, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  emptyCtaLabel: { color: colors.navy, fontSize: 14.5, fontFamily: fonts.sansExtraBold },
  list: { paddingHorizontal: 18, paddingBottom: 24, gap: 11 },
  row: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 15 },
  rowPressed: { opacity: 0.7 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusPillText: { fontSize: 11, fontFamily: fonts.sansExtraBold },
  rowId: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.muted },
  rowTitle: { fontSize: 15, fontFamily: fonts.sansExtraBold, color: colors.text, marginTop: 10, lineHeight: 20 },
  rowMeta: { fontSize: 12.5, color: colors.muted, marginTop: 8, fontFamily: fonts.sansSemibold },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(10,20,30,0.45)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 28 },
  sheetHandle: { width: 42, height: 4, borderRadius: 999, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontFamily: fonts.serifExtraBold, fontSize: 20, color: colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 999, borderWidth: 1, borderColor: colors.border, minHeight: 44 },
  chipSelected: { backgroundColor: colors.navyLight, borderColor: colors.navy },
  chipText: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text },
  chipTextSelected: { color: colors.navy },
  sheetButton: { marginTop: 18, minHeight: 52, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  sheetButtonLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
});
