import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { useAuth } from '../../auth/AuthContext';
import { navigationRef } from '../../navigation/navigationRef';
import { CITY_BY_SLUG } from '../../graphql/queries/public.queries';
import type { City } from '../../graphql/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import { colors, fonts } from '../../theme';

// A14 — role and city are read-only. Language is set once on the Landing page, not per-role.
export function AdminProfileScreen() {
  const { session, logout } = useAuth();
  const user = session?.user;
  const citySlug = getSavedCitySlug() ?? '';
  const { data } = useQuery<{ cityBySlug: City | null }>(CITY_BY_SLUG, { variables: { slug: citySlug }, skip: !citySlug });

  function handleLogout() {
    logout();
    if (navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Landing' }] });
    }
  }

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name ?? 'Admin'}</Text>
            <Text style={styles.mobile}>+91 {user?.mobile}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Row label="Role" value="Municipal Admin" />
          <Row label="City" value={data?.cityBySlug?.name ?? '—'} last />
        </View>

        <Text style={styles.note}>Role and city are fixed on the account and cannot be changed here.</Text>

        <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={handleLogout}>
          <Text style={styles.logoutLabel}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.green },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontFamily: fonts.sansExtraBold, color: colors.green },
  name: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.text },
  mobile: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.muted },
  rowValue: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.text },
  note: { fontSize: 12.5, color: colors.muted, lineHeight: 19, fontFamily: fonts.sansSemibold },
  logoutButton: { minHeight: 52, borderWidth: 1, borderColor: colors.red, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pressed: { opacity: 0.85 },
  logoutLabel: { color: colors.red, fontSize: 15.5, fontFamily: fonts.sansExtraBold },
});
