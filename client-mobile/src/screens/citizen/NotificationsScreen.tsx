import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
  BellOff,
  CircleCheck,
  CircleX,
  UserCheck,
  Hammer,
  CheckCheck,
  CalendarClock,
  Megaphone,
  Bell,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MARK_NOTIFICATION_READ, MY_NOTIFICATIONS } from '../../graphql/queries/notification.queries';
import type { Notification } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

// Real trigger types sent server-side (services/core-service/src/services/request.service.ts and
// announcement.resolvers.ts) — six request-lifecycle triggers plus notice publishing.
const TYPE_ICON: Record<string, typeof Bell> = {
  request_verified: CircleCheck,
  request_rejected: CircleX,
  request_assigned: UserCheck,
  request_in_progress: Hammer,
  request_completed: CheckCheck,
  request_closed: CheckCheck,
  appointment_scheduled: CalendarClock,
  announcement_published: Megaphone,
};

// N1 (populated) / N2 (empty) — tapping a row marks it read and drops the badge, then
// deep-links to the linked request or, for an announcement notification, to Notices.
export function NotificationsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ myNotifications: Notification[] }>(MY_NOTIFICATIONS, {
    variables: { unreadOnly: false },
  });
  const [markRead] = useMutation(MARK_NOTIFICATION_READ, {
    refetchQueries: [
      { query: MY_NOTIFICATIONS, variables: { unreadOnly: false } },
      { query: MY_NOTIFICATIONS, variables: { unreadOnly: true } },
    ],
  });

  const notifications = data?.myNotifications ?? [];

  function handlePress(n: Notification) {
    if (!n.isRead) markRead({ variables: { id: n.id } });
    if (n.requestId) navigation.navigate('RequestDetail', { id: n.requestId });
    else navigation.navigate('Notices');
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notifications.headerTitle')}</Text>
      </View>
      {loading && notifications.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.navy} />
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <BellOff size={30} color={colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>{t('notifications.allCaughtUp')}</Text>
          <Text style={styles.emptyBody}>{t('notifications.emptyBody')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {notifications.map((item) => {
            const Icon = TYPE_ICON[item.type] ?? Bell;
            return (
              <Pressable key={item.id} style={[styles.row, item.isRead && styles.rowRead]} onPress={() => handlePress(item)}>
                <View style={[styles.iconWrap, { backgroundColor: item.isRead ? colors.background : colors.navyLight }]}>
                  <Icon size={18} color={colors.navy} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowMessage}>{item.message}</Text>
                  <Text style={styles.rowDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                {!item.isRead && <View style={styles.dot} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.navy },
  headerTitle: { fontFamily: fonts.serifExtraBold, fontSize: 19, color: colors.white },
  empty: { alignItems: 'center', gap: 13, marginTop: 60, paddingHorizontal: 26 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.serifExtraBold, fontSize: 20, color: colors.text },
  emptyBody: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.navyLight, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 },
  rowRead: { backgroundColor: colors.white },
  iconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1 },
  rowMessage: { fontSize: 14, color: colors.text, fontFamily: fonts.sansExtraBold, lineHeight: 20 },
  rowDate: { fontSize: 11.5, color: colors.muted, marginTop: 6, fontFamily: fonts.sansBold },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.navy, marginTop: 6 },
});
