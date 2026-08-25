import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@apollo/client';
import { Users } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { REQUEST_OTP } from '../../graphql/mutations/auth.mutations';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminLogin'>;

// A1 — access scoped to one city.
export function AdminLoginScreen({ navigation }: Props) {
  const [mobile, setMobile] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [requestOtp, { loading }] = useMutation<{ requestOtp: boolean }>(REQUEST_OTP);

  async function handleSendOtp() {
    setFormError(null);
    try {
      await requestOtp({ variables: { mobile } });
      navigation.navigate('AdminOtp', { mobile });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  }

  const canSend = mobile.length === 10;

  return (
    <Screen>
      <View style={styles.iconWrap}>
        <Users size={24} color={colors.green} />
      </View>
      <Text style={styles.title}>Admin Login</Text>
      <Text style={styles.subtitle}>Enter your registered mobile number.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Mobile Number</Text>
        <View style={[styles.inputBox, canSend && styles.inputBoxActive]}>
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
        <Pressable
          disabled={!canSend || loading}
          onPress={handleSendOtp}
          style={({ pressed }) => [styles.sendButton, (!canSend || loading) && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.sendLabel}>{loading ? 'Sending…' : 'Send OTP'}</Text>
        </Pressable>
        <Text style={styles.note}>Your access is scoped to this municipality only.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 24 },
  title: { fontSize: 24, fontFamily: fonts.serifExtraBold, color: colors.text, textAlign: 'center', marginTop: 14 },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6 },
  form: { marginTop: 22 },
  label: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 8 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 14,
    minHeight: 58,
  },
  inputBoxActive: { borderColor: colors.green },
  prefix: { fontSize: 18, fontFamily: fonts.sansBold, color: colors.muted },
  divider: { width: 1, height: 24, backgroundColor: colors.border },
  input: { flex: 1, fontSize: 21, fontFamily: fonts.sansExtraBold, letterSpacing: 1, color: colors.text },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  sendButton: { marginTop: 18, minHeight: 54, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  sendLabel: { color: colors.white, fontSize: 16.5, fontFamily: fonts.sansExtraBold },
  note: { fontSize: 12, color: colors.muted, marginTop: 12, lineHeight: 17 },
});
