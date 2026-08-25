import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { User, Phone, Mail, MapPin, LogOut } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../auth/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountSheet'>;

// S11.1 — logout fires immediately, no confirmation dialog, back to Landing; city stays saved.
export function AccountSheetScreen({ navigation }: Props) {
  const { session, logout } = useAuth();
  const { t } = useTranslation();
  const user = session?.user;

  function handleLogout() {
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

  const rows = [
    { label: t('common.name'), value: user?.name ?? '—', Icon: User },
    { label: t('common.mobile'), value: user?.mobile ? `+91 ${user.mobile}` : '—', Icon: Phone },
    { label: t('common.email'), value: user?.email ?? '—', Icon: Mail },
    { label: t('common.ward'), value: user?.ward ? `${user.ward.name} (${user.ward.code})` : '—', Icon: MapPin },
  ];

  const initial = (user?.name ?? '?').charAt(0).toUpperCase();

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.backdrop} onPress={() => navigation.goBack()} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.role}>{t('common.citizen')} · {session?.citySlug}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {rows.map(({ label, value, Icon }, i) => (
            <View key={label} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
              <Icon size={17} color={colors.muted} />
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={handleLogout}>
          <LogOut size={18} color="#B42318" />
          <Text style={styles.logoutText}>{t('common.logOut')}</Text>
        </Pressable>
        <Text style={styles.footnote}>{t('account.footnote')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,20,30,0.45)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  handle: { width: 42, height: 4, borderRadius: 999, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 18 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.serifExtraBold, fontSize: 22, color: colors.navy },
  name: { fontFamily: fonts.serifExtraBold, fontSize: 20, color: colors.text },
  role: { fontSize: 12.5, color: colors.muted, marginTop: 3, fontFamily: fonts.sansSemibold, textTransform: 'capitalize' },
  card: { marginTop: 18, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 12.5, fontFamily: fonts.sansExtraBold, color: colors.muted, width: 64 },
  rowValue: { flex: 1, fontSize: 14, fontFamily: fonts.sansBold, color: colors.text, textAlign: 'right' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 16, minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: '#F0C9C9', backgroundColor: colors.redLight },
  pressed: { opacity: 0.85 },
  logoutText: { color: '#B42318', fontSize: 15.5, fontFamily: fonts.sansExtraBold },
  footnote: { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18, marginTop: 11 },
});
