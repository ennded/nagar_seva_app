import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApolloError, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Clock, Lock } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { REQUEST_OTP, VERIFY_OTP } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload } from '../../graphql/types';
import { useAuth } from '../../auth/AuthContext';
import type { RootStackParamList, StaffRole } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpEntry'>;

// Matches the real backend (services/core-service/src/auth/otp.ts): 5-minute expiry, 5 attempts
// per code — the mockup's illustrative copy said 3, but the actual server constants win.
const CODE_LIFETIME_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 5;

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// S2.3–S2.6 — live countdown, wrong-code counter (per-code, resets on resend), a distinct
// network-failure state that doesn't burn an attempt, lockout once attempts or time run out, and
// the staff-number branch discovered only after a successful verify.
export function OtpEntryScreen({ route, navigation }: Props) {
  const { mobile } = route.params;
  const { login } = useAuth();
  const { t } = useTranslation();

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(CODE_LIFETIME_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [formError, setFormError] = useState<string | null>(null);
  const [netError, setNetError] = useState(false);
  const [justResent, setJustResent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [requestOtp, { loading: resending }] = useMutation<{ requestOtp: boolean }>(REQUEST_OTP);
  const [verifyOtp, { loading: verifying }] = useMutation<{ verifyOtp: AuthPayload }>(VERIFY_OTP);

  const locked = secondsLeft <= 0 || attemptsLeft <= 0;

  useEffect(() => {
    if (code.length === 6) handleVerify();
  }, [code]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleResend() {
    setFormError(null);
    setNetError(false);
    try {
      await requestOtp({ variables: { mobile } });
      setCode('');
      setAttemptsLeft(MAX_ATTEMPTS);
      setSecondsLeft(CODE_LIFETIME_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setJustResent(true);
      setTimeout(() => setJustResent(false), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to resend OTP');
    }
  }

  async function handleVerify() {
    if (code.length !== 6 || verifying) return;
    setFormError(null);
    setNetError(false);
    try {
      const { data } = await verifyOtp({ variables: { mobile, code } });
      if (!data) return;

      if (data.verifyOtp.user.role !== 'CITIZEN') {
        // S2.6-adjacent, discovered late: the number belongs to staff. Hand off to that role's
        // own login (which issues its own fresh OTP) rather than reusing this already-consumed code.
        navigation.replace('StaffLogin', { role: data.verifyOtp.user.role as StaffRole });
        return;
      }
      login(data.verifyOtp);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      // A network failure never reaches checkOtp() server-side, so it hasn't consumed a real
      // attempt — don't burn one of the user's tries or claim the code was wrong when we don't
      // actually know that.
      if (err instanceof ApolloError && err.networkError && err.graphQLErrors.length === 0) {
        setNetError(true);
        setCode('');
        return;
      }

      const message = err instanceof ApolloError ? err.graphQLErrors[0]?.message ?? '' : '';
      if (message.includes('not_found')) {
        // No matching OtpRequest server-side at all — a stale/consumed code, or this mobile
        // number never actually had one sent (requestOtp always returns true even for unknown
        // numbers, so the client can't tell in advance). Don't lock; let them resend right away.
        setFormError(t('otp.invalidCode'));
      } else if (message.includes('expired')) {
        setSecondsLeft(0);
      } else if (message.includes('too_many_attempts')) {
        setAttemptsLeft(0);
      } else if (attemptsLeft <= 1) {
        setAttemptsLeft(0);
      } else {
        setAttemptsLeft((n) => n - 1);
        setFormError(t('otp.incorrectCode', { count: attemptsLeft - 1, plural: attemptsLeft - 1 === 1 ? '' : 's' }));
      }
      setCode('');
    }
  }

  const masked = mobile.length >= 4 ? `${mobile.slice(0, 2)}••• ••${mobile.slice(-3)}` : mobile;

  return (
    <Screen>
      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { backgroundColor: colors.orange }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.navy }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.green }]} />
      </View>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <ChevronLeft size={18} color={colors.navy} />
        <Text style={styles.backLabel}>{t('otp.changeNumber')}</Text>
      </Pressable>

      <View style={styles.card}>
        {!locked ? (
          <>
            <Text style={styles.title}>{t('otp.enterCode')}</Text>
            <Text style={styles.subtitle}>{t('otp.sentTo', { mobile: masked })}</Text>

            <View style={styles.clockPill}>
              <Clock size={16} color={colors.navy} />
              <Text style={styles.clockText}>{t('otp.expiresIn', { time: formatClock(secondsLeft) })}</Text>
            </View>

            <View style={styles.boxes}>
              {Array.from({ length: 6 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.box,
                    i === code.length && !formError && !netError && styles.boxActive,
                    code[i] && styles.boxFilled,
                    (formError || netError) && styles.boxError,
                  ]}
                >
                  <Text style={styles.boxChar}>{code[i] ?? ''}</Text>
                </View>
              ))}
              {/* Invisible input overlaying the boxes above — captures the native numeric
                  keypad (auto-advance, backspace) while the boxes handle all the rendering. */}
              <TextInput
                value={code}
                onChangeText={(val) => setCode(val.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={styles.hiddenOverlayInput}
                caretHidden
              />
            </View>

            {formError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}
            {netError && (
              <View style={styles.warnBanner}>
                <Text style={styles.warnText}>{t('otp.networkError')}</Text>
              </View>
            )}
            {justResent && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{t('otp.newCodeSent')}</Text>
              </View>
            )}

            <Pressable
              disabled={code.length !== 6 || verifying}
              onPress={handleVerify}
              style={({ pressed }) => [styles.submitButton, (code.length !== 6 || verifying) && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.submitLabel}>{verifying ? t('otp.verifying') : t('otp.verifyAndContinue')}</Text>
            </Pressable>
            <Pressable onPress={handleResend} disabled={resendCooldown > 0 || resending} style={styles.linkButton}>
              <Text style={[styles.linkLabel, resendCooldown > 0 && styles.linkMuted]}>
                {resending
                  ? t('otp.resending')
                  : resendCooldown > 0
                    ? t('otp.resendIn', { seconds: resendCooldown.toString().padStart(2, '0') })
                    : t('otp.resendCode')}
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.lockedWrap}>
            <View style={styles.lockIconWrap}>
              <Lock size={28} color={colors.red} />
            </View>
            <Text style={styles.lockedTitle}>{attemptsLeft <= 0 ? t('otp.tooManyAttempts') : t('otp.codeExpired')}</Text>
            <Text style={styles.lockedSubtitle}>
              {attemptsLeft <= 0 ? t('otp.usedAllAttempts') : t('otp.noLongerValid')}
              {t('otp.requestNewOne')}
            </Text>
            <Pressable
              disabled={resending}
              onPress={handleResend}
              style={({ pressed }) => [styles.submitButton, { width: '100%' }, resending && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.submitLabel}>{resending ? t('auth.sending') : t('otp.resendCode')}</Text>
            </Pressable>
            <Pressable onPress={() => navigation.replace('LoginEmail')} style={styles.linkButton}>
              <Text style={styles.linkLabel}>{t('auth.loginWithEmailInstead')}</Text>
            </Pressable>
          </View>
        )}
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
  clockPill: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.navyLight, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, marginTop: 14 },
  clockText: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.navy },
  boxes: { flexDirection: 'row', gap: 7, marginTop: 16, position: 'relative' },
  box: { flex: 1, height: 56, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: colors.navy },
  boxFilled: { backgroundColor: colors.white },
  boxError: { borderColor: colors.red },
  boxChar: { fontSize: 23, fontFamily: fonts.sansExtraBold, color: colors.text },
  hiddenOverlayInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  errorBanner: { marginTop: 12, padding: 11, borderRadius: 12, backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#F0C9C9' },
  errorText: { color: '#B42318', fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 18 },
  warnBanner: { marginTop: 12, padding: 11, borderRadius: 12, backgroundColor: '#FDF3E7', borderWidth: 1, borderColor: '#F0DAB9' },
  warnText: { color: '#8A4A0B', fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 18 },
  successBanner: { marginTop: 12, padding: 11, borderRadius: 12, backgroundColor: colors.greenLight, borderWidth: 1, borderColor: '#C4E4D3' },
  successText: { color: '#146848', fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 18 },
  submitButton: { marginTop: 16, minHeight: 54, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  submitLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  linkButton: { marginTop: 8, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.navy },
  linkMuted: { color: colors.muted },
  lockedWrap: { alignItems: 'center', gap: 14, paddingTop: 6 },
  lockIconWrap: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { fontFamily: fonts.serifExtraBold, fontSize: 20, color: colors.text },
  lockedSubtitle: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
