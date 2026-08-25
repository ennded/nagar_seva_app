import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { LOGIN } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload } from '../../graphql/types';
import { useAuth } from '../../auth/AuthContext';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginEmail'>;

// S2.1 / S2.1e — email/password citizen login. One generic error covers both an unknown email
// and a wrong password — the backend never says which field failed.
export function LoginEmailScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { t } = useTranslation();
  const citySlug = getSavedCitySlug() ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [runLogin, { loading }] = useMutation<{ login: AuthPayload }>(LOGIN);

  async function handleSubmit() {
    setFormError(null);
    try {
      const { data } = await runLogin({ variables: { email, password } });
      if (data) login(data.login);
    } catch {
      setFormError(t('auth.invalidCredentials'));
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <Screen>
      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { backgroundColor: colors.orange }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.navy }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.green }]} />
      </View>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <ChevronLeft size={18} color={colors.navy} />
        <Text style={styles.backLabel}>{t('auth.landing')}</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.title}>{t('auth.citizenLogin')}</Text>
        <Text style={styles.subtitle}>{t('auth.loginWithEmail', { cityPrefix: citySlug ? `${citySlug} · ` : '' })}</Text>
        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}
        <View style={styles.form}>
          <View>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={[styles.input, formError && styles.inputError]}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                setFormError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <View style={[styles.passwordRow, formError && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  setFormError(null);
                }}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                {showPassword ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
              </Pressable>
            </View>
          </View>
        </View>
        <Pressable
          disabled={!canSubmit || loading}
          onPress={handleSubmit}
          style={({ pressed }) => [styles.submitButton, (!canSubmit || loading) && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.submitLabel}>{loading ? t('auth.loggingIn') : t('auth.logIn')}</Text>
        </Pressable>
        <View style={styles.linksCol}>
          <Pressable onPress={() => navigation.navigate('LoginMobile')} style={styles.linkButton}>
            <Text style={styles.linkLabel}>{t('auth.useMobileOtp')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
            <Text style={styles.linkMuted}>
              {t('auth.newHere')} <Text style={styles.linkStrong}>{t('auth.register')}</Text>
            </Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.footnote}>{t('auth.footnoteSameError')}</Text>
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
  errorBanner: { marginTop: 14, padding: 11, borderRadius: 12, backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#F0C9C9' },
  errorText: { color: '#B42318', fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 18 },
  form: { marginTop: 16, gap: 14 },
  label: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: '#F5F7FA', paddingHorizontal: 13, minHeight: 50, fontSize: 15, color: colors.text },
  inputError: { borderColor: colors.red },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: '#F5F7FA', paddingHorizontal: 13, minHeight: 50 },
  passwordInput: { flex: 1, fontSize: 17, letterSpacing: 2, color: colors.text },
  submitButton: { marginTop: 20, minHeight: 54, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  submitLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  linksCol: { alignItems: 'center', marginTop: 12, gap: 2 },
  linkButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.navy },
  linkMuted: { fontSize: 13.5, color: colors.muted, fontFamily: fonts.sansSemibold },
  linkStrong: { color: colors.navy, fontFamily: fonts.sansExtraBold, textDecorationLine: 'underline' },
  footnote: { fontSize: 12, color: colors.muted, lineHeight: 18, textAlign: 'center', marginTop: 14 },
});
