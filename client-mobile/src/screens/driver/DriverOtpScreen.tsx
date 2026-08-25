import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApolloError, useMutation } from '@apollo/client';
import { ShieldCheck } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { REQUEST_OTP, VERIFY_OTP } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload } from '../../graphql/types';
import { useAuth } from '../../auth/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverOtp'>;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

// D2 — six digits entered on a large on-screen keypad instead of the native keyboard, so the
// code can be entered outdoors with gloves on.
export function DriverOtpScreen({ route, navigation }: Props) {
  const { mobile } = route.params;
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [requestOtp, { loading: resending }] = useMutation<{ requestOtp: boolean }>(REQUEST_OTP);
  const [verifyOtp, { loading: verifying }] = useMutation<{ verifyOtp: AuthPayload }>(VERIFY_OTP);

  function pressKey(k: string) {
    if (k === 'del') {
      setCode((c) => c.slice(0, -1));
      return;
    }
    setCode((c) => (c.length >= 6 ? c : c + k));
  }

  useEffect(() => {
    if (code.length === 6) handleVerify();
  }, [code]);

  async function handleVerify() {
    if (code.length !== 6 || verifying) return;
    setFormError(null);
    try {
      const { data } = await verifyOtp({ variables: { mobile, code } });
      if (!data) return;
      if (data.verifyOtp.user.role !== 'DRIVER') {
        setFormError('This mobile number is not registered as a driver.');
        setCode('');
        return;
      }
      login(data.verifyOtp);
      navigation.reset({ index: 0, routes: [{ name: 'DriverDashboard' }] });
    } catch (err) {
      if (err instanceof ApolloError && err.networkError && err.graphQLErrors.length === 0) {
        setFormError('Could not reach the server. Check your connection and try again.');
      } else {
        setFormError('Incorrect code. Please try again.');
      }
      setCode('');
    }
  }

  async function handleResend() {
    setFormError(null);
    setCode('');
    try {
      await requestOtp({ variables: { mobile } });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to resend OTP');
    }
  }

  const masked = mobile.length >= 4 ? `${mobile.slice(0, 2)}••• ••${mobile.slice(-3)}` : mobile;

  return (
    <Screen scroll={false}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <ShieldCheck size={26} color={colors.cyan} />
        </View>
        <Text style={styles.title}>Verify & Login</Text>
        <Text style={styles.subtitle}>OTP sent to +91 {masked}</Text>

        <View style={styles.boxes}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={[styles.box, i === code.length && styles.boxActive, code[i] && styles.boxFilled]}>
              <Text style={styles.boxChar}>{code[i] ?? ''}</Text>
            </View>
          ))}
        </View>

        {formError && <Text style={styles.error}>{formError}</Text>}

        <Pressable
          disabled={code.length !== 6 || verifying}
          onPress={handleVerify}
          style={({ pressed }) => [styles.verifyButton, (code.length !== 6 || verifying) && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.verifyLabel}>{verifying ? 'Verifying…' : 'Verify & Login'}</Text>
        </Pressable>

        <Pressable onPress={handleResend} disabled={resending} style={styles.resend}>
          <Text style={styles.resendLabel}>{resending ? 'Resending…' : 'Resend code'}</Text>
        </Pressable>
      </View>

      <View style={styles.keypad}>
        {KEYS.map((k, i) => (
          <Pressable
            key={i}
            disabled={k === ''}
            onPress={() => pressKey(k)}
            style={({ pressed }) => [styles.key, k === '' && styles.keyBlank, pressed && k !== '' && styles.keyPressed]}
          >
            <Text style={styles.keyLabel}>{k === 'del' ? '⌫' : k}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 24 },
  iconWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.cyanLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 25, fontFamily: fonts.serifExtraBold, color: colors.text, marginTop: 14 },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 6 },
  boxes: { flexDirection: 'row', gap: 8, marginTop: 18 },
  box: { width: 44, height: 58, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: colors.cyan },
  boxFilled: { backgroundColor: colors.white },
  boxChar: { fontSize: 24, fontFamily: fonts.sansExtraBold, color: colors.text },
  error: { color: colors.red, fontSize: 13, marginTop: 14, textAlign: 'center' },
  verifyButton: { marginTop: 18, width: '100%', minHeight: 58, borderRadius: 12, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  verifyLabel: { color: colors.white, fontSize: 17, fontFamily: fonts.sansExtraBold },
  resend: { marginTop: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  resendLabel: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.muted, textDecorationLine: 'underline' },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 26,
  },
  key: { flexBasis: '31%', flexGrow: 1, minHeight: 54, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  keyBlank: { backgroundColor: 'transparent', borderWidth: 0 },
  keyPressed: { backgroundColor: colors.background },
  keyLabel: { fontSize: 23, fontFamily: fonts.sansBold, color: colors.text },
});
