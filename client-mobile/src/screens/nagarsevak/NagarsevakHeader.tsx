import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { Users, Bell, MapPin } from 'lucide-react-native';
import { useAuth } from '../../auth/AuthContext';
import { MY_NOTIFICATIONS } from '../../graphql/queries/notification.queries';
import type { Notification } from '../../graphql/types';
import { colors, fonts } from '../../theme';

// Shared amber header used across every nagarsevak screen. A ward pill sits in every header so
// the scope is never in doubt, per nagarsevak-mock's explicit design note.
export function NagarsevakHeader({ onBellPress }: { onBellPress: () => void }) {
  const { session } = useAuth();
  const user = session?.user;
  const { data } = useQuery<{ myNotifications: Notification[] }>(MY_NOTIFICATIONS, {
    variables: { unreadOnly: true },
    pollInterval: 30_000,
  });
  const unreadCount = data?.myNotifications.length ?? 0;

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Users size={17} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Nagarsevak</Text>
          <Text style={styles.name}>{user?.name ?? 'Nagarsevak'}</Text>
        </View>
        <Pressable onPress={onBellPress} style={styles.bellButton}>
          <Bell size={19} color={colors.white} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
      {user?.ward && (
        <View style={styles.wardPillWrap}>
          <View style={styles.wardPill}>
            <MapPin size={12} color={colors.white} />
            <Text style={styles.wardPillText}>{user.ward.name}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, backgroundColor: colors.amber },
  row: { paddingHorizontal: 18, paddingBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 10.5, fontFamily: fonts.sansExtraBold, letterSpacing: 0.7, textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' },
  name: { fontSize: 17.5, fontFamily: fonts.serifExtraBold, color: colors.white, marginTop: 2 },
  bellButton: { padding: 4, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: colors.white, fontSize: 10, fontFamily: fonts.sansExtraBold },
  wardPillWrap: { paddingHorizontal: 18, paddingBottom: 13 },
  wardPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  wardPillText: { fontSize: 12, fontFamily: fonts.sansExtraBold, color: colors.white },
});
