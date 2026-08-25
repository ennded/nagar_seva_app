import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { REQUEST_OTP, VERIFY_OTP } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload } from '../../graphql/types';
import { useAuth } from '../../auth/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StaffLogin'>;

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  OFFICER: 'Officer',
  NAGARSEVAK: 'Nagarsevak',
  NAGARADHYAKSH: 'Nagaradhyaksh',
  DRIVER: 'Driver',
};

export function StaffLoginScreen({ route }: Props) {
  const { role } = route.params;
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [requestOtp, { loading: requesting }] = useMutation<{ requestOtp: boolean }>(REQUEST_OTP);
  const [verifyOtp, { loading: verifying }] = useMutation<{ verifyOtp: AuthPayload }>(VERIFY_OTP);

  async function handleRequestOtp() {
    setFormError(null);
    try {
      await requestOtp({ variables: { mobile } });
      setOtpSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  }

  async function handleVerifyOtp() {
    setFormError(null);
    try {
      const { data } = await verifyOtp({ variables: { mobile, code } });
      if (!data) return;
      if (data.verifyOtp.user.role !== role) {
        setFormError(`This mobile number is not registered as ${ROLE_LABEL[role]}.`);
        return;
      }
      login(data.verifyOtp);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'OTP verification failed');
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>{ROLE_LABEL[role]} Login</Text>
      <Text style={styles.subtitle}>
        {otpSent ? 'Enter the OTP sent to your mobile number' : 'Log in with your registered mobile number'}
      </Text>

      {!otpSent ? (
        <View style={styles.form}>
          <TextField label="Mobile number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" autoCapitalize="none" />
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Button label="Send OTP" onPress={handleRequestOtp} loading={requesting} disabled={!mobile} />
        </View>
      ) : (
        <View style={styles.form}>
          <TextField label="OTP code" value={code} onChangeText={setCode} keyboardType="number-pad" />
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Button label="Verify & Login" onPress={handleVerifyOtp} loading={verifying} disabled={!code} />
          <Button
            label="Use a different number"
            variant="secondary"
            onPress={() => {
              setOtpSent(false);
              setCode('');
              setFormError(null);
            }}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 24 },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: 8 },
  form: { gap: 14 },
  error: { color: colors.red, fontSize: 13 },
});
