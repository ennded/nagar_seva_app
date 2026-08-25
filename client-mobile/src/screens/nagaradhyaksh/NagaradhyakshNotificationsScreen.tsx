import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import { BellOff, Bell } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MARK_NOTIFICATION_READ, MY_NOTIFICATIONS } from '../../graphql/queries/notification.queries';
import type { Notification } from '../../graphql/types';
import type { NagaradhyakshTabParamList, OverviewStackParamList } from '../../navigation/nagaradhyakshTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<OverviewStackParamList, 'Notifications'>,
  BottomTabScreenProps<NagaradhyakshTabParamList>
>;

// P12 — city-wide alerts; tapping one with a linked request opens its read-only detail
// (cross-tab navigation into the Requests tab's own stack).
export function NagaradhyakshNotificationsScreen({ navigation }: Props) {
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
    if (n.requestId) {
      navigation.navigate('RequestsTab', { screen: 'RequestDetail', params: { id: n.requestId } });
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading && notifications.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.red} />
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <BellOff size={32} color={colors.muted} />
            <Text style={styles.emptyText}>You're all caught up</Text>
          </View>
        ) : (
          notifications.map((n) => (
            <Pressable
              key={n.id}
              style={({ pressed }) => [styles.row, !n.isRead && styles.rowUnread, pressed && styles.rowPressed]}
              onPress={() => handlePress(n)}
            >
              <View style={styles.iconWrap}>
                <Bell size={15} color={colors.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.message}>{n.message}</Text>
                <Text style={styles.time}>{new Date(n.createdAt).toLocaleString()}</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.red },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 10 },
  empty: { alignItems: 'center', gap: 8, marginTop: 60 },
  emptyText: { fontSize: 14, color: colors.muted },
  row: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  rowUnread: { backgroundColor: colors.redLight },
  rowPressed: { opacity: 0.7 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' },
  message: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.text, lineHeight: 19 },
  time: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 4 },
});
