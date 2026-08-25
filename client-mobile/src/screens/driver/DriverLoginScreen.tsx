import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@apollo/client';
import { Trash2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { REQUEST_OTP } from '../../graphql/mutations/auth.mutations';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverLogin'>;

// D1 — larger type and a taller field than the other staff roles: this screen is used outdoors,
// often with gloves.
export function DriverLoginScreen({ navigation }: Props) {
  const [mobile, setMobile] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [requestOtp, { loading }] = useMutation<{ requestOtp: boolean }>(REQUEST_OTP);

  async function handleSendOtp() {
    setFormError(null);
    try {
      await requestOtp({ variables: { mobile } });
      navigation.navigate('DriverOtp', { mobile });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  }

  return (
    <Screen>
      <View style={styles.iconWrap}>
        <Trash2 size={26} color={colors.cyan} />
      </View>
      <Text style={styles.title}>Driver Login</Text>
      <Text style={styles.subtitle}>Enter your mobile number.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.inputBox}>
          <Text style={styles.prefix}>+91</Text>
          <View style={styles.divider} />
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="98765 43210"
            placeholderTextColor={colors.muted}
          />
        </View>
        {formError && <Text style={styles.error}>{formError}</Text>}
        <Pressable disabled={!mobile || loading} onPress={handleSendOtp} style={({ pressed }) => [styles.sendButton, (!mobile || loading) && styles.disabled, pressed && styles.pressed]}>
          <Text style={styles.sendLabel}>{loading ? 'Sending…' : 'Send OTP'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.cyanLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 24 },
  title: { fontSize: 25, fontFamily: fonts.serifExtraBold, color: colors.text, textAlign: 'center', marginTop: 14 },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 6 },
  form: { marginTop: 22 },
  label: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 8 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.cyan,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 14,
    minHeight: 62,
  },
  prefix: { fontSize: 19, fontFamily: fonts.sansBold, color: colors.muted },
  divider: { width: 1, height: 26, backgroundColor: colors.border },
  input: { flex: 1, fontSize: 23, fontFamily: fonts.sansExtraBold, letterSpacing: 1, color: colors.text },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  sendButton: { marginTop: 20, minHeight: 60, borderRadius: 12, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  sendLabel: { color: colors.white, fontSize: 18, fontFamily: fonts.sansExtraBold },
});
