import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Search,
  FilePlus,
  CalendarPlus,
  ListChecks,
  Megaphone,
  Truck,
  PhoneCall,
  Inbox,
  Clock,
  MapPin,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../auth/AuthContext';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import { MY_NOTIFICATIONS } from '../../graphql/queries/notification.queries';
import { setLanguage } from '../../i18n';
import type { Complaint, Notification, RequestUnion } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const TILES: { key: keyof RootStackParamList; labelKey: string; Icon: typeof FilePlus; bg: string; color: string }[] = [
  { key: 'ComplaintWizard', labelKey: 'home.tileNewComplaint', Icon: FilePlus, bg: colors.navyLight, color: colors.navy },
  { key: 'AppointmentWizard', labelKey: 'home.tileBookAppointment', Icon: CalendarPlus, bg: colors.navyLight, color: colors.navy },
  { key: 'MyRequests', labelKey: 'home.tileTrackRequests', Icon: ListChecks, bg: colors.navyLight, color: colors.navy },
  { key: 'Notices', labelKey: 'home.tileNotices', Icon: Megaphone, bg: colors.amberLight, color: colors.amber },
  { key: 'GarbageTracking', labelKey: 'home.tileGarbageVehicle', Icon: Truck, bg: colors.cyanLight, color: colors.cyan },
  { key: 'EmergencyContacts', labelKey: 'home.tileEmergency', Icon: PhoneCall, bg: colors.redLight, color: colors.red },
];

const STATUS_TONE: Record<string, { bg: string; color: string }> = {
  REGISTERED: { bg: colors.navyLight, color: colors.navy },
  VERIFIED: { bg: '#EAF0F9', color: '#1D4ED8' },
  ASSIGNED: { bg: '#EAF0F9', color: '#1D4ED8' },
  IN_PROGRESS: { bg: '#EAF0F9', color: '#1D4ED8' },
  SCHEDULED: { bg: '#EAF0F9', color: '#1D4ED8' },
  COMPLETED: { bg: colors.greenLight, color: colors.green },
  CLOSED: { bg: colors.greenLight, color: colors.green },
  REJECTED: { bg: colors.redLight, color: colors.red },
};

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'home.greetingMorning';
  if (h < 17) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

// S3.1 (returning citizen, populated) / S3.2 (first run, no data) — same screen, the "recent
// request" card and empty-state CTA are just conditional on whether myRequests is empty.
export function HomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { t, i18n } = useTranslation();
  const { data: requestsData } = useQuery<{ myRequests: RequestUnion[] }>(MY_REQUESTS);
  const { data: notifData } = useQuery<{ myNotifications: Notification[] }>(MY_NOTIFICATIONS, {
    variables: { unreadOnly: true },
  });

  const requests = requestsData?.myRequests ?? [];
  const unreadCount = notifData?.myNotifications.length ?? 0;
  const mostRecent = useMemo(
    () => [...requests].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0],
    [requests],
  );

  const name = session?.user.name ?? 'Citizen';
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('AccountSheet')} style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{t(greetingKey())}</Text>
          <Text style={styles.name}>{name.split(' ')[0]}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.bellButton}>
          <Bell size={21} color={colors.white} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
      <View style={styles.utilityRow}>
        <View style={styles.cityPill}>
          <MapPin size={12} color="rgba(255,255,255,0.9)" />
          <Text style={styles.cityPillText}>{session?.citySlug}</Text>
        </View>
        <View style={styles.langToggle}>
          <Pressable style={[styles.langOption, i18n.language === 'en' && styles.langOptionActive]} onPress={() => setLanguage('en')}>
            <Text style={[styles.langOptionText, i18n.language === 'en' && styles.langOptionTextActive]}>EN</Text>
          </Pressable>
          <Pressable style={[styles.langOption, i18n.language === 'mr' && styles.langOptionActive]} onPress={() => setLanguage('mr')}>
            <Text style={[styles.langOptionText, i18n.language === 'mr' && styles.langOptionTextActive]}>मर</Text>
          </Pressable>
        </View>
      </View>
      <Pressable style={styles.searchBar} onPress={() => navigation.navigate('MyRequests')}>
        <Search size={17} color="rgba(255,255,255,0.9)" />
        <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
      </Pressable>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View>
          <Text style={styles.sectionKicker}>{t('home.whatDoYouNeed')}</Text>
          <View style={styles.grid}>
            {TILES.map(({ key, labelKey, Icon, bg, color }) => (
              <Pressable
                key={key}
                style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
                onPress={() => navigation.navigate(key as never)}
              >
                <View style={[styles.tileIconWrap, { backgroundColor: bg }]}>
                  <Icon size={19} color={color} />
                </View>
                <Text style={styles.tileLabel}>{t(labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.sectionKicker}>{t('home.recent')}</Text>
            {requests.length > 0 && (
              <Pressable onPress={() => navigation.navigate('MyRequests')}>
                <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
              </Pressable>
            )}
          </View>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Inbox size={27} color={colors.muted} />
              </View>
              <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
              <Text style={styles.emptySubtitle}>{t('home.emptySubtitle')}</Text>
              <Pressable style={styles.emptyCta} onPress={() => navigation.navigate('ComplaintWizard')}>
                <Text style={styles.emptyCtaLabel}>{t('home.reportComplaint')}</Text>
              </Pressable>
            </View>
          ) : (
            mostRecent && (
              <Pressable style={styles.recentCard} onPress={() => navigation.navigate('RequestDetail', { id: mostRecent.id })}>
                <View style={styles.recentTop}>
                  <View style={[styles.statusPill, { backgroundColor: (STATUS_TONE[mostRecent.status] ?? STATUS_TONE.REGISTERED).bg }]}>
                    <Text style={[styles.statusPillText, { color: (STATUS_TONE[mostRecent.status] ?? STATUS_TONE.REGISTERED).color }]}>
                      {t(`status.${mostRecent.status}`)}
                    </Text>
                  </View>
                  <Text style={styles.recentId}>{mostRecent.id.slice(-8).toUpperCase()}</Text>
                </View>
                <Text style={styles.recentTitle} numberOfLines={2}>
                  {mostRecent.__typename === 'Complaint' ? (mostRecent as Complaint).title : mostRecent.purpose}
                </Text>
                <View style={styles.recentMetaRow}>
                  <Clock size={14} color={colors.muted} />
                  <Text style={styles.recentMeta}>{t('home.updated', { date: new Date(mostRecent.createdAt).toLocaleDateString() })}</Text>
                </View>
              </Pressable>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.serifExtraBold, fontSize: 17, color: colors.white },
  greeting: { fontSize: 11.5, color: 'rgba(255,255,255,0.88)', fontFamily: fonts.sansBold },
  name: { fontFamily: fonts.serifExtraBold, fontSize: 20, color: colors.white },
  bellButton: { padding: 10, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 5, right: 4, minWidth: 19, height: 19, borderRadius: 999, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: colors.navy },
  badgeText: { color: colors.white, fontSize: 11, fontFamily: fonts.sansExtraBold },
  utilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 12 },
  cityPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  cityPillText: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: 'rgba(255,255,255,0.92)', textTransform: 'capitalize' },
  langToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, padding: 3, gap: 2 },
  langOption: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  langOptionActive: { backgroundColor: colors.white },
  langOptionText: { fontSize: 11, fontFamily: fonts.sansExtraBold, color: 'rgba(255,255,255,0.85)' },
  langOptionTextActive: { color: colors.navy },
  searchBar: { marginHorizontal: 18, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', borderRadius: 12, paddingHorizontal: 13, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchPlaceholder: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: fonts.sansSemibold },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 18 },
  sectionKicker: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 11 },
  tile: { width: '31%', minHeight: 96, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 9 },
  tilePressed: { opacity: 0.7 },
  tileIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 12, fontFamily: fonts.sansExtraBold, color: colors.text, textAlign: 'center', lineHeight: 15 },
  recentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewAll: { fontSize: 12.5, fontFamily: fonts.sansExtraBold, color: colors.navy },
  emptyState: { marginTop: 11, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 26, alignItems: 'center', gap: 12 },
  emptyIconWrap: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.serifExtraBold, fontSize: 18, color: colors.text },
  emptySubtitle: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  emptyCta: { minHeight: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  emptyCtaLabel: { color: colors.white, fontSize: 14.5, fontFamily: fonts.sansExtraBold },
  recentCard: { marginTop: 11, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 15 },
  recentTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusPillText: { fontSize: 11, fontFamily: fonts.sansExtraBold },
  recentId: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.muted },
  recentTitle: { fontSize: 15.5, fontFamily: fonts.sansExtraBold, color: colors.text, marginTop: 10, lineHeight: 21 },
  recentMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9 },
  recentMeta: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansSemibold },
});
