import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../auth/AuthContext';
import { navigationRef } from '../../navigation/navigationRef';
import type { ProfileStackParamList } from '../../navigation/nagarsevakTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

// N11 — ward is read-only (the Admin sets it). Language is set once on the Landing page, not
// per-role.
export function NagarsevakProfileScreen({ navigation }: Props) {
  const { session, logout } = useAuth();
  const user = session?.user;

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
            <Text style={styles.name}>{user?.name ?? 'Nagarsevak'}</Text>
            <Text style={styles.mobile}>+91 {user?.mobile}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Row label="Ward" value={user?.ward?.name ?? '—'} last />
        </View>

        <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]} onPress={() => navigation.navigate('WardReport')}>
          <Text style={styles.menuLabel}>Ward Report</Text>
          <Text style={styles.menuChevron}>›</Text>
        </Pressable>

        <Text style={styles.note}>Ward assignment is set by the Municipal Admin.</Text>

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
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.amber },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.amberLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontFamily: fonts.sansExtraBold, color: colors.amber },
  name: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.text },
  mobile: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.muted },
  rowValue: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.text },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  menuRowPressed: { opacity: 0.7 },
  menuLabel: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text },
  menuChevron: { fontSize: 20, color: colors.muted, fontFamily: fonts.sansBold },
  note: { fontSize: 12.5, color: colors.muted, lineHeight: 19, fontFamily: fonts.sansSemibold },
  logoutButton: { minHeight: 52, borderWidth: 1, borderColor: colors.red, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pressed: { opacity: 0.85 },
  logoutLabel: { color: colors.red, fontSize: 15.5, fontFamily: fonts.sansExtraBold },
});
