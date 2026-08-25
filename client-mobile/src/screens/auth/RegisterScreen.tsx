import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Building2, CreditCard, FileCheck, IdCard, Eye, EyeOff } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { WARDS_BY_CITY } from '../../graphql/queries/public.queries';
import { REGISTER_CITIZEN } from '../../graphql/mutations/auth.mutations';
import { uploadKycDocument } from '../../apollo/upload';
import type { AuthPayload, WardRef } from '../../graphql/types';
import { useAuth } from '../../auth/AuthContext';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

// S2.7 / S2.8 — city is already fixed at S0/S1 level, so registration only needs the ward within
// it. On a server-side duplicate rejection, every field the citizen entered stays as-is (we only
// clear formError, never the form state) — only the error message clears when the number is edited.
export function RegisterScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { t } = useTranslation();
  const citySlug = getSavedCitySlug() ?? '';

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wardId, setWardId] = useState('');
  const [aadharDocUrl, setAadharDocUrl] = useState('');
  const [voterIdDocUrl, setVoterIdDocUrl] = useState('');
  const [uploading, setUploading] = useState<'aadhar' | 'voterId' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [dupError, setDupError] = useState(false);
  const [registered, setRegistered] = useState(false);

  const { data: wardsData, loading: wardsLoading } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, {
    variables: { citySlug },
    skip: !citySlug,
  });
  const [registerCitizen, { loading }] = useMutation<{ registerCitizen: AuthPayload }>(REGISTER_CITIZEN);

  async function pickDocument(kind: 'aadhar' | 'voterId') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError(t('register.photoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(kind);
    setFormError(null);
    try {
      const url = await uploadKycDocument({
        uri: asset.uri,
        name: asset.fileName ?? `${kind}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
      if (kind === 'aadhar') setAadharDocUrl(url);
      else setVoterIdDocUrl(url);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('register.uploadFailed'));
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit() {
    setFormError(null);
    setDupError(false);
    try {
      const { data } = await registerCitizen({
        variables: {
          input: {
            citySlug,
            name,
            mobile,
            email,
            password,
            wardId,
            aadharDocUrl: aadharDocUrl || undefined,
            voterIdDocUrl: voterIdDocUrl || undefined,
          },
        },
      });
      if (data) {
        login(data.registerCitizen);
        setRegistered(true);
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }, 900);
      }
    } catch (err) {
      setDupError(true);
      setFormError(err instanceof Error ? err.message : t('register.duplicateAccount'));
    }
  }

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    Boolean(citySlug && name && mobile && email && password && confirmPassword && wardId) &&
    !passwordMismatch &&
    !loading &&
    !registered;

  return (
    <Screen>
      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { backgroundColor: colors.orange }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.navy }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.green }]} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('register.title')}</Text>
        <View style={styles.cityPill}>
          <Building2 size={15} color={colors.navy} />
          <Text style={styles.cityPillText}>{t('register.citySelected', { city: citySlug })}</Text>
        </View>

        {dupError && formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Field label={t('register.fullName')} value={name} onChangeText={setName} onClearError={() => setDupError(false)} />
          <Field
            label={t('register.mobileNumber')}
            value={mobile}
            onChangeText={(val) => {
              setMobile(val);
              setDupError(false);
            }}
            keyboardType="phone-pad"
          />
          <Field label={t('register.email')} value={email} onChangeText={setEmail} onClearError={() => setDupError(false)} keyboardType="email-address" autoCapitalize="none" />
          <Field label={t('register.password')} value={password} onChangeText={setPassword} onClearError={() => setDupError(false)} secureTextEntry />
          <View>
            <Field
              label={t('register.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onClearError={() => setDupError(false)}
              secureTextEntry
            />
            {passwordMismatch && <Text style={styles.fieldError}>{t('register.passwordMismatch')}</Text>}
          </View>

          <View>
            <Text style={styles.label}>{t('register.ward')}</Text>
            {wardsLoading ? (
              <ActivityIndicator color={colors.navy} style={styles.wardLoading} />
            ) : wardsData?.wardsByCity.length ? (
              <View style={styles.chipRow}>
                {wardsData.wardsByCity.map((ward) => {
                  const selected = wardId === ward.id;
                  return (
                    <Pressable
                      key={ward.id}
                      onPress={() => setWardId(ward.id)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{ward.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.wardEmpty}>{t('register.noWards')}</Text>
            )}
          </View>

          <View style={{ gap: 9 }}>
            <Pressable
              onPress={() => pickDocument('aadhar')}
              disabled={uploading === 'aadhar'}
              style={[styles.uploadRow, aadharDocUrl && styles.uploadRowDone]}
            >
              {aadharDocUrl ? <FileCheck size={18} color={colors.green} /> : <IdCard size={18} color={colors.navy} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadLabel}>
                  {aadharDocUrl ? t('register.aadharAdded') : uploading === 'aadhar' ? t('register.uploading') : t('register.uploadAadhar')}
                </Text>
                <Text style={styles.uploadHint}>{t('register.optional')}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => pickDocument('voterId')}
              disabled={uploading === 'voterId'}
              style={[styles.uploadRow, voterIdDocUrl && styles.uploadRowDone]}
            >
              {voterIdDocUrl ? <FileCheck size={18} color={colors.green} /> : <CreditCard size={18} color={colors.navy} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadLabel}>
                  {voterIdDocUrl ? t('register.voterIdAdded') : uploading === 'voterId' ? t('register.uploading') : t('register.uploadVoterId')}
                </Text>
                <Text style={styles.uploadHint}>{t('register.optional')}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {formError && !dupError && <Text style={styles.plainError}>{formError}</Text>}

        <Pressable
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={({ pressed }) => [styles.submitButton, !canSubmit && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.submitLabel}>{loading ? t('register.creatingAccount') : t('register.createAccount')}</Text>
        </Pressable>
        {registered && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{t('register.success')}</Text>
          </View>
        )}
        <Pressable onPress={() => navigation.navigate('LoginEmail')} style={styles.linkButton}>
          <Text style={styles.linkLabel}>{t('register.alreadyHaveAccount')}</Text>
        </Pressable>
      </View>
      <Text style={styles.footnote}>{t('register.footnote')}</Text>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  onClearError,
  secureTextEntry,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  onClearError?: () => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  secureTextEntry?: boolean;
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.inputBoxField}
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            onClearError?.();
          }}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry ? hidden : undefined}
          {...rest}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} style={styles.eyeButton}>
            {hidden ? <Eye size={18} color={colors.muted} /> : <EyeOff size={18} color={colors.muted} />}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', height: 4, marginHorizontal: -16, marginTop: -16 },
  progressBar: { flex: 1 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 20, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  title: { fontFamily: fonts.serifExtraBold, fontSize: 24, color: colors.text },
  cityPill: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', backgroundColor: colors.navyLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  cityPillText: { fontSize: 12.5, fontFamily: fonts.sansExtraBold, color: colors.navy },
  errorBanner: { marginTop: 14, padding: 11, borderRadius: 12, backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#F0C9C9' },
  errorText: { color: '#B42318', fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 18 },
  form: { marginTop: 16, gap: 13 },
  label: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 7 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: '#F5F7FA', paddingHorizontal: 13, minHeight: 48 },
  inputBoxField: { flex: 1, fontSize: 14.5, color: colors.text },
  eyeButton: { padding: 4, marginLeft: 6 },
  fieldError: { color: colors.red, fontSize: 12, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipSelected: { backgroundColor: colors.navyLight, borderColor: colors.navy },
  chipText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text },
  chipTextSelected: { color: colors.navy },
  wardLoading: { alignSelf: 'flex-start', marginTop: 4 },
  wardEmpty: { fontSize: 12.5, color: colors.muted },
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, padding: 13, minHeight: 56, backgroundColor: colors.white },
  uploadRowDone: { borderStyle: 'solid', borderColor: colors.green, backgroundColor: colors.greenLight },
  uploadLabel: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  uploadHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  plainError: { color: colors.red, fontSize: 13, marginTop: 12 },
  successBanner: { marginTop: 12, padding: 11, borderRadius: 12, backgroundColor: colors.greenLight, borderWidth: 1, borderColor: '#C4E4D3' },
  successText: { color: '#146848', fontSize: 13, fontFamily: fonts.sansBold, textAlign: 'center' },
  submitButton: { marginTop: 20, minHeight: 54, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  submitLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  linkButton: { marginTop: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.navy },
  footnote: { fontSize: 12, color: colors.muted, lineHeight: 18, textAlign: 'center', marginTop: 14 },
});
