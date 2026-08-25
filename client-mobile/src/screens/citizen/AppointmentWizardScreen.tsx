import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { CalendarClock } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { OFFICERS_BY_DEPARTMENT } from '../../graphql/queries/officer.queries';
import { SUBMIT_APPOINTMENT } from '../../graphql/mutations/request.mutations';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import { useAuth } from '../../auth/AuthContext';
import type { Appointment, DepartmentRef, UserFields } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentWizard'>;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// S5.1–S5.4 — department picked per city, officer availability shown read-only for context — the
// citizen never picks a slot themselves; an officer confirms date/time later (scheduleAppointment
// on the staff side).
export function AppointmentWizardScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [departmentId, setDepartmentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');
  const [requested, setRequested] = useState<Appointment | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: deptData } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, {
    variables: { citySlug: session?.citySlug },
    skip: !session?.citySlug,
  });
  const { data: officersData } = useQuery<{ officersByDepartment: UserFields[] }>(OFFICERS_BY_DEPARTMENT, {
    variables: { departmentId },
    skip: !departmentId,
  });
  const [submitAppointment, { loading }] = useMutation<{ submitAppointment: Appointment }>(SUBMIT_APPOINTMENT, {
    refetchQueries: [{ query: MY_REQUESTS }],
  });

  const departmentName = deptData?.departmentsByCity.find((d) => d.id === departmentId)?.name ?? '';

  async function handleSubmit() {
    setFormError(null);
    try {
      const { data } = await submitAppointment({
        variables: { input: { departmentId, purpose, remarks: remarks || undefined } },
      });
      if (data) setRequested(data.submitAppointment);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('appointmentWizard.submitFailed'));
    }
  }

  if (requested) {
    return (
      <Screen scroll={false}>
        <View style={styles.successWrap}>
          <View style={styles.successBadge}>
            <CalendarClock size={36} color={colors.navy} />
          </View>
          <Text style={styles.successTitle}>{t('appointmentWizard.requestedTitle')}</Text>
          <Text style={styles.successSubtitle}>{t('appointmentWizard.requestedSubtitle')}</Text>
          <View style={styles.successCard}>
            <Text style={styles.successCardLabel}>{t('appointmentWizard.requestId')}</Text>
            <Text style={styles.successCardId}>{requested.id.slice(-8).toUpperCase()}</Text>
            <View style={styles.successDivider} />
            <Text style={styles.successPurpose}>
              {departmentName} · {purpose}
            </Text>
            <Text style={styles.successStatus}>{t('appointmentWizard.statusRegistered')}</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => navigation.replace('RequestDetail', { id: requested.id })}>
            <Text style={styles.primaryButtonLabel}>{t('appointmentWizard.viewAppointments')}</Text>
          </Pressable>
          <Pressable style={styles.textButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.textButtonLabel}>{t('appointmentWizard.backToHome')}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const stepNames = [t('appointmentWizard.stepDepartment'), t('appointmentWizard.stepAvailability'), t('appointmentWizard.stepPurpose')];

  return (
    <Screen>
      <View style={styles.progressRow}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.progressSeg, n <= step && styles.progressSegDone]} />
        ))}
      </View>
      <Text style={styles.stepMeta}>{t('appointmentWizard.stepMeta', { step, name: stepNames[step - 1] })}</Text>

      {step === 1 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{t('appointmentWizard.whichDepartment')}</Text>
          <View style={styles.chipRow}>
            {deptData?.departmentsByCity.map((d) => {
              const selected = departmentId === d.id;
              return (
                <Pressable
                  key={d.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setDepartmentId(d.id)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{d.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            disabled={!departmentId}
            onPress={() => setStep(2)}
            style={({ pressed }) => [styles.nextButton, !departmentId && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.nextButtonLabel}>{t('appointmentWizard.next')}</Text>
          </Pressable>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{t('appointmentWizard.officerAvailability')}</Text>
          <Text style={styles.stepSubtitle}>{t('appointmentWizard.availabilityHelp', { department: departmentName })}</Text>
          {(officersData?.officersByDepartment ?? []).map((o) => (
            <View key={o.id} style={styles.officerCard}>
              <View style={styles.officerTop}>
                <View style={styles.officerAvatar}>
                  <Text style={styles.officerInitial}>{o.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.officerName}>{o.name}</Text>
                  <Text style={styles.officerDesig}>{t('appointmentWizard.officer')}</Text>
                </View>
              </View>
              <View style={styles.officerHours}>
                {o.availability.length === 0 ? (
                  <Text style={styles.officerSlotEmpty}>{t('appointmentWizard.noAvailability')}</Text>
                ) : (
                  o.availability
                    .slice()
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((slot, i) => (
                      <View key={i} style={styles.officerHourRow}>
                        <Text style={styles.officerDay}>{t(`day.${DAY_NAMES[slot.dayOfWeek]}`)}</Text>
                        <Text style={styles.officerTime}>
                          {slot.startTime} – {slot.endTime}
                        </Text>
                      </View>
                    ))
                )}
              </View>
            </View>
          ))}
          <View style={styles.navRow}>
            <Pressable style={styles.backButton} onPress={() => setStep(1)}>
              <Text style={styles.backButtonLabel}>{t('appointmentWizard.back')}</Text>
            </Pressable>
            <Pressable style={styles.nextButtonFlex} onPress={() => setStep(3)}>
              <Text style={styles.nextButtonLabel}>{t('appointmentWizard.next')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{t('appointmentWizard.purposeOfMeeting')}</Text>
          <View>
            <Text style={styles.label}>{t('appointmentWizard.purpose')}</Text>
            <TextInput
              style={styles.input}
              value={purpose}
              onChangeText={setPurpose}
              placeholder={t('appointmentWizard.purposePlaceholder')}
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>
              {t('appointmentWizard.remarks')} <Text style={styles.labelOptional}>{t('appointmentWizard.optional')}</Text>
            </Text>
            <TextInput
              style={styles.textarea}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              placeholder={t('appointmentWizard.remarksPlaceholder')}
              placeholderTextColor={colors.muted}
            />
          </View>
          {formError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}
          <View style={styles.navRow}>
            <Pressable style={styles.backButton} onPress={() => setStep(2)}>
              <Text style={styles.backButtonLabel}>{t('appointmentWizard.back')}</Text>
            </Pressable>
            <Pressable
              disabled={!purpose.trim() || loading}
              onPress={handleSubmit}
              style={({ pressed }) => [styles.nextButtonFlex, (!purpose.trim() || loading) && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.nextButtonLabel}>{loading ? t('appointmentWizard.submitting') : t('appointmentWizard.submit')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', height: 5, marginHorizontal: -16 },
  progressSeg: { flex: 1, backgroundColor: colors.border },
  progressSegDone: { backgroundColor: colors.navy },
  stepMeta: { fontSize: 12, fontFamily: fonts.sansExtraBold, color: colors.muted, marginTop: 10 },
  stepBody: { gap: 14, marginTop: 4 },
  stepTitle: { fontFamily: fonts.serifExtraBold, fontSize: 22, color: colors.text },
  stepSubtitle: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: -8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, minHeight: 46 },
  chipSelected: { backgroundColor: colors.navyLight, borderColor: colors.navy },
  chipText: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.text },
  chipTextSelected: { color: colors.navy },
  officerCard: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15 },
  officerTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  officerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.purpleLight, alignItems: 'center', justifyContent: 'center' },
  officerInitial: { fontFamily: fonts.serifExtraBold, fontSize: 14, color: colors.purple },
  officerName: { fontSize: 14.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  officerDesig: { fontSize: 12, color: colors.muted, marginTop: 2 },
  officerHours: { marginTop: 12, gap: 7 },
  officerHourRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  officerDay: { width: 78, fontSize: 13, fontFamily: fonts.sansExtraBold, color: colors.muted },
  officerTime: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text },
  officerSlotEmpty: { fontSize: 12.5, color: colors.muted },
  label: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 7 },
  labelOptional: { color: colors.muted, fontFamily: fonts.sansSemibold },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 13, minHeight: 50, fontSize: 14.5, color: colors.text },
  textarea: { minHeight: 130, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white, padding: 13, fontSize: 14.5, lineHeight: 22, color: colors.text, textAlignVertical: 'top' },
  errorBanner: { padding: 11, borderRadius: 12, backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#F0C9C9' },
  errorText: { color: '#B42318', fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 18 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  backButton: { minHeight: 52, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  backButtonLabel: { fontSize: 15, fontFamily: fonts.sansExtraBold, color: colors.text },
  nextButton: { minHeight: 52, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  nextButtonFlex: { flex: 1, minHeight: 52, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  nextButtonLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 15 },
  successBadge: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: fonts.serifExtraBold, fontSize: 24, color: colors.text },
  successSubtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  successCard: { width: '100%', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  successCardLabel: { fontSize: 11, fontFamily: fonts.sansExtraBold, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.muted },
  successCardId: { fontFamily: fonts.sansExtraBold, fontSize: 19, color: colors.navy, marginTop: 6 },
  successDivider: { height: 1, backgroundColor: colors.border, marginVertical: 13 },
  successPurpose: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.text },
  successStatus: { fontSize: 12.5, color: colors.muted, marginTop: 5, fontFamily: fonts.sansSemibold },
  primaryButton: { width: '100%', minHeight: 52, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  primaryButtonLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.navy },
});
