import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { Users, Bell } from 'lucide-react-native';
import { useAuth } from '../../auth/AuthContext';
import { MY_NOTIFICATIONS } from '../../graphql/queries/notification.queries';
import { CITY_BY_SLUG } from '../../graphql/queries/public.queries';
import type { City, Notification } from '../../graphql/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import { colors, fonts } from '../../theme';

export function AdminHeader({ onBellPress }: { onBellPress: () => void }) {
  const { session } = useAuth();
  const user = session?.user;
  const citySlug = getSavedCitySlug() ?? '';
  const { data: cityData } = useQuery<{ cityBySlug: City | null }>(CITY_BY_SLUG, { variables: { slug: citySlug }, skip: !citySlug });
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
          <Text style={styles.kicker}>Municipal Admin</Text>
          <Text style={styles.name}>{user?.name ?? 'Admin'}</Text>
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
      {cityData?.cityBySlug && <Text style={styles.scope}>{cityData.cityBySlug.name}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 52, backgroundColor: colors.green },
  row: { paddingHorizontal: 18, paddingBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 10.5, fontFamily: fonts.sansExtraBold, letterSpacing: 0.7, textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' },
  name: { fontSize: 17.5, fontFamily: fonts.serifExtraBold, color: colors.white, marginTop: 2 },
  bellButton: { padding: 4, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: colors.green, fontSize: 10, fontFamily: fonts.sansExtraBold },
  scope: { paddingHorizontal: 18, paddingBottom: 13, fontSize: 12, fontFamily: fonts.sansSemibold, color: 'rgba(255,255,255,0.9)' },
});
