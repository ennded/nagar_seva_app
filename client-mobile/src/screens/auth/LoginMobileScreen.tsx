import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { REQUEST_OTP } from '../../graphql/mutations/auth.mutations';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginMobile'>;

// S2.2 — sends the OTP; who the number belongs to (citizen vs staff) is only known once the code
// is verified (see OtpEntryScreen), since the backend doesn't reveal role before that.
export function LoginMobileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [mobile, setMobile] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [requestOtp, { loading }] = useMutation<{ requestOtp: boolean }>(REQUEST_OTP);

  async function handleSendOtp() {
    setFormError(null);
    try {
      await requestOtp({ variables: { mobile } });
      navigation.navigate('OtpEntry', { mobile });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  }

  const canSend = mobile.length === 10;

  return (
    <Screen>
      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { backgroundColor: colors.orange }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.navy }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.green }]} />
      </View>
      <Pressable onPress={() => navigation.navigate('LoginEmail')} style={styles.backButton}>
        <ChevronLeft size={18} color={colors.navy} />
        <Text style={styles.backLabel}>{t('auth.citizenLogin')}</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.title}>{t('auth.loginWithOtp')}</Text>
        <Text style={styles.subtitle}>{t('auth.otpSubtitle')}</Text>
        <View style={styles.form}>
          <Text style={styles.label}>{t('auth.mobileNumber')}</Text>
          <View style={[styles.inputBox, canSend && styles.inputBoxActive]}>
            <Text style={styles.prefix}>+91</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="98220 41176"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>
        {formError && <Text style={styles.error}>{formError}</Text>}
        <Pressable
          disabled={!canSend || loading}
          onPress={handleSendOtp}
          style={({ pressed }) => [styles.submitButton, (!canSend || loading) && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.submitLabel}>{loading ? t('auth.sending') : t('auth.sendOtp')}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('LoginEmail')} style={styles.linkButton}>
          <Text style={styles.linkLabel}>{t('auth.loginWithEmailInstead')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', height: 4, marginHorizontal: -16, marginTop: -16 },
  progressBar: { flex: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, marginTop: 8 },
  backLabel: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.navy },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 20, marginTop: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  title: { fontFamily: fonts.serifExtraBold, fontSize: 24, color: colors.text },
  subtitle: { fontSize: 13.5, color: colors.muted, marginTop: 6, lineHeight: 19 },
  form: { marginTop: 18 },
  label: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 7 },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: '#F5F7FA', paddingHorizontal: 13, minHeight: 56 },
  inputBoxActive: { borderColor: colors.navy },
  prefix: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.muted },
  divider: { width: 1, height: 24, backgroundColor: colors.border },
  input: { flex: 1, fontSize: 19, fontFamily: fonts.sansExtraBold, letterSpacing: 0.5, color: colors.text },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  submitButton: { marginTop: 18, minHeight: 54, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  submitLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  linkButton: { marginTop: 8, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.navy },
});
