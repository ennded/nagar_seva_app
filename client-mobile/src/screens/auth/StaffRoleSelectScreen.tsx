import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Users, FileText, Bell, BarChart3, Trash2, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import type { RootStackParamList, StaffRole } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StaffRoleSelect'>;

// Shared entry point for every staff role — same role-tile layout/icons as every role mockup's
// own O0/N0/P0/A0/D0 screen (they're all identical copies of this one screen).
const ROLES: {
  role: StaffRole;
  labelKey: string;
  descKey: string;
  Icon: typeof Users;
  color: string;
  bg: string;
}[] = [
  { role: 'ADMIN', labelKey: 'auth.roleAdminLabel', descKey: 'auth.roleAdminDesc', Icon: Users, color: colors.green, bg: colors.greenLight },
  { role: 'OFFICER', labelKey: 'auth.roleOfficerLabel', descKey: 'auth.roleOfficerDesc', Icon: FileText, color: colors.purple, bg: colors.purpleLight },
  { role: 'NAGARSEVAK', labelKey: 'auth.roleNagarsevakLabel', descKey: 'auth.roleNagarsevakDesc', Icon: Bell, color: colors.amber, bg: colors.amberLight },
  { role: 'NAGARADHYAKSH', labelKey: 'auth.roleNagaradhyakshLabel', descKey: 'auth.roleNagaradhyakshDesc', Icon: BarChart3, color: colors.red, bg: colors.redLight },
  { role: 'DRIVER', labelKey: 'auth.roleDriverLabel', descKey: 'auth.roleDriverDesc', Icon: Trash2, color: colors.cyan, bg: colors.cyanLight },
];

export function StaffRoleSelectScreen({ navigation }: Props) {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text style={styles.title}>{t('auth.municipalityStaff')}</Text>
      <Text style={styles.subtitle}>{t('auth.selectRoleToSignIn')}</Text>
      <View style={styles.list}>
        {ROLES.map(({ role, labelKey, descKey, Icon, color, bg }) => (
          <Pressable
            key={role}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => {
              if (role === 'DRIVER') navigation.navigate('DriverLogin');
              else if (role === 'OFFICER') navigation.navigate('OfficerLogin');
              else if (role === 'NAGARSEVAK') navigation.navigate('NagarsevakLogin');
              else if (role === 'NAGARADHYAKSH') navigation.navigate('NagaradhyakshLogin');
              else if (role === 'ADMIN') navigation.navigate('AdminLogin');
              else navigation.navigate('StaffLogin', { role });
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: bg }]}>
              <Icon size={20} color={color} />
            </View>
            <View style={styles.tileText}>
              <Text style={styles.tileLabel}>{t(labelKey)}</Text>
              <Text style={styles.tileDesc}>{t(descKey)}</Text>
            </View>
            <ChevronRight size={17} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serifExtraBold, fontSize: 25, color: colors.text, textAlign: 'center', marginTop: 24 },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 8 },
  list: { gap: 10, marginTop: 8 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 13,
    minHeight: 72,
  },
  tilePressed: { opacity: 0.7 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileText: { flex: 1, minWidth: 0 },
  tileLabel: { fontSize: 15.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  tileDesc: { fontSize: 12.5, color: colors.muted, marginTop: 3 },
});
