import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Trash2, Construction, Droplets, Lightbulb, Waves, CircleEllipsis, Plus, MapPin, Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { SUBMIT_COMPLAINT } from '../../graphql/mutations/request.mutations';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import { uploadComplaintPhoto } from '../../apollo/upload';
import { useAuth } from '../../auth/AuthContext';
import type { Complaint } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ComplaintWizard'>;

const CATEGORIES: { key: string; labelKey: string; Icon: typeof Trash2 }[] = [
  { key: 'garbage', labelKey: 'category.garbage', Icon: Trash2 },
  { key: 'roads', labelKey: 'category.roads', Icon: Construction },
  { key: 'water_supply', labelKey: 'category.water_supply', Icon: Droplets },
  { key: 'streetlight', labelKey: 'category.streetlight', Icon: Lightbulb },
  { key: 'drainage', labelKey: 'category.drainage', Icon: Waves },
  { key: 'other', labelKey: 'category.other', Icon: CircleEllipsis },
];

const LANDMARK_SUGGESTIONS = ['Near bus stop', 'Opposite school', 'Behind market', 'Near temple'];

const DESCRIPTION_MAX = 300;
const DESCRIPTION_NEAR_LIMIT = 260;
const WARN_BYTES = 40 * 1024 * 1024;
const BLOCK_BYTES = 50 * 1024 * 1024;

type Step = 1 | 2 | 3 | 4 | 5;
type Phase = 'editing' | 'submitting' | 'error' | 'success';

// S4.1–S4.8 — five-step wizard, nothing saved server-side until Submit on the review step;
// closing mid-wizard past step 1 asks to discard (S4.7), matching the "nothing persisted" model.
export function ComplaintWizardScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState(route.params?.category ?? '');
  const [description, setDescription] = useState('');
  const [landmark, setLandmark] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoSizes, setPhotoSizes] = useState<Record<string, number>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sizeWarning, setSizeWarning] = useState<'warn' | 'block' | null>(null);
  const [phase, setPhase] = useState<Phase>('editing');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Complaint | null>(null);

  const stepRef = useRef(step);
  stepRef.current = step;

  const [submitComplaint] = useMutation<{ submitComplaint: Complaint }>(SUBMIT_COMPLAINT, {
    refetchQueries: [{ query: MY_REQUESTS }],
  });

  // S4.7 — only prompt when a later step was actually reached; on step 1 it exits straight out.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (phase === 'success' || stepRef.current <= 1) return;
      e.preventDefault();
      Alert.alert(
        t('complaintWizard.discardTitle'),
        t('complaintWizard.discardBody'),
        [
          { text: t('complaintWizard.keepEditing'), style: 'cancel' },
          { text: t('complaintWizard.discard'), style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, phase]);

  const totalBytes = Object.values(photoSizes).reduce((a, b) => a + b, 0);

  async function addPhoto() {
    if (totalBytes >= BLOCK_BYTES) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSizeWarning(null);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const prospectiveTotal = totalBytes + (asset.fileSize ?? 0);
    if (prospectiveTotal > BLOCK_BYTES) {
      setSizeWarning('block');
      return;
    }

    setUploadingPhoto(true);
    try {
      const url = await uploadComplaintPhoto({
        uri: asset.uri,
        name: asset.fileName ?? 'complaint.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setPhotoUrls((prev) => [...prev, url]);
      setPhotoSizes((prev) => ({ ...prev, [url]: asset.fileSize ?? 0 }));
      setSizeWarning(prospectiveTotal > WARN_BYTES ? 'warn' : null);
    } catch {
      setSizeWarning(null);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit() {
    setPhase('submitting');
    setSubmitError(null);
    const catMeta = CATEGORIES.find((c) => c.key === category);
    const label = catMeta ? t(catMeta.labelKey) : category;
    try {
      const { data } = await submitComplaint({
        variables: {
          input: {
            title: label,
            category,
            description,
            address: landmark.trim() || t('complaintWizard.notSpecified'),
            photoUrls,
          },
        },
      });
      if (data) {
        setSubmitted(data.submitComplaint);
        setPhase('success');
      }
    } catch (err) {
      // S4.8 — failure returns to Review with everything preserved; nothing was persisted yet.
      setSubmitError(err instanceof Error ? err.message : t('complaintWizard.submitFailed'));
      setPhase('error');
    }
  }

  if (phase === 'success' && submitted) {
    return (
      <Screen scroll={false}>
        <View style={styles.successWrap}>
          <View style={styles.successBadge}>
            <Check size={38} color={colors.green} />
          </View>
          <Text style={styles.successTitle}>{t('complaintWizard.registeredTitle')}</Text>
          <Text style={styles.successSubtitle}>{t('complaintWizard.registeredSubtitle')}</Text>
          <View style={styles.successCard}>
            <Text style={styles.successCardLabel}>{t('complaintWizard.complaintId')}</Text>
            <Text style={styles.successCardId}>{submitted.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.successCardHint}>{t('complaintWizard.keepForReference')}</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => navigation.replace('RequestDetail', { id: submitted.id })}>
            <Text style={styles.primaryButtonLabel}>{t('complaintWizard.trackComplaint')}</Text>
          </Pressable>
          <Pressable style={styles.textButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.textButtonLabel}>{t('complaintWizard.backToHome')}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const stepNames = [
    t('complaintWizard.stepCategory'),
    t('complaintWizard.stepDescription'),
    t('complaintWizard.stepPhotos'),
    t('complaintWizard.stepLandmark'),
    t('complaintWizard.stepReview'),
  ];

  return (
    <Screen>
      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n} style={[styles.progressSeg, n <= step && styles.progressSegDone]} />
        ))}
      </View>
      <Text style={styles.stepMeta}>{t('complaintWizard.stepMeta', { step, name: stepNames[step - 1] })}</Text>

      {step === 1 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{t('complaintWizard.whatIsProblem')}</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(({ key, labelKey, Icon }) => {
              const selected = category === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.categoryTile, selected && styles.categoryTileSelected]}
                  onPress={() => {
                    setCategory(key);
                    setStep(2);
                  }}
                >
                  <Icon size={22} color={selected ? colors.navy : colors.text} />
                  <Text style={styles.categoryLabel}>{t(labelKey)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{t('complaintWizard.describeProblem')}</Text>
          <Text style={styles.stepSubtitle}>
            {t('complaintWizard.describeHelp', { category: category ? t(CATEGORIES.find((c) => c.key === category)?.labelKey ?? '') : '' })}
          </Text>
          <TextInput
            value={description}
            onChangeText={(val) => setDescription(val.slice(0, DESCRIPTION_MAX))}
            multiline
            style={styles.textarea}
            placeholder={t('complaintWizard.descriptionPlaceholder')}
            placeholderTextColor={colors.muted}
          />
          <View style={styles.counterRow}>
            <Text style={[styles.counter, description.length >= DESCRIPTION_NEAR_LIMIT && styles.counterWarn]}>
              {description.length} / {DESCRIPTION_MAX}
            </Text>
            {description.length >= DESCRIPTION_NEAR_LIMIT && <Text style={styles.counterWarnText}>{t('complaintWizard.nearLimit')}</Text>}
          </View>
          <WizardNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={description.trim().length === 0} />
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{t('complaintWizard.addPhotos')}</Text>
          <Text style={styles.stepSubtitle}>{t('complaintWizard.addPhotosHelp')}</Text>
          <View style={styles.photoGrid}>
            {photoUrls.map((url) => (
              <View key={url} style={styles.photoCell}>
                <Image source={{ uri: url }} style={styles.photoImage} />
              </View>
            ))}
            <Pressable
              disabled={uploadingPhoto || totalBytes >= BLOCK_BYTES}
              onPress={addPhoto}
              style={[styles.addPhotoCell, (uploadingPhoto || totalBytes >= BLOCK_BYTES) && styles.disabled]}
            >
              <Plus size={20} color={colors.navy} />
              <Text style={styles.addPhotoLabel}>{uploadingPhoto ? t('complaintWizard.uploading') : t('complaintWizard.add')}</Text>
            </Pressable>
          </View>
          {photoUrls.length > 0 && (
            <Text style={styles.photoTotal}>{t('complaintWizard.mbAttached', { mb: (totalBytes / (1024 * 1024)).toFixed(1) })}</Text>
          )}
          {sizeWarning === 'warn' && (
            <View style={styles.warnBanner}>
              <Text style={styles.warnText}>{t('complaintWizard.warnLargeUpload')}</Text>
            </View>
          )}
          {sizeWarning === 'block' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{t('complaintWizard.blockLimitReached')}</Text>
            </View>
          )}
          <WizardNav onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel={photoUrls.length ? t('complaintWizard.next') : t('complaintWizard.skip')} />
        </View>
      )}

      {step === 4 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{t('complaintWizard.whereIsIt')}</Text>
          <Text style={styles.stepSubtitle}>{t('complaintWizard.landmarkHelp')}</Text>
          <TextInput
            style={styles.input}
            value={landmark}
            onChangeText={setLandmark}
            placeholder={t('complaintWizard.landmarkPlaceholder')}
            placeholderTextColor={colors.muted}
          />
          <View style={styles.chipRow}>
            {LANDMARK_SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.chip} onPress={() => setLandmark(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.wardCard}>
            <MapPin size={18} color={colors.navy} />
            <View>
              <Text style={styles.wardCardTitle}>{session?.user.ward?.name ?? t('complaintWizard.yourWard')}</Text>
              <Text style={styles.wardCardHint}>{t('complaintWizard.wardNotEditable')}</Text>
            </View>
          </View>
          <WizardNav onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel={landmark ? t('complaintWizard.review') : t('complaintWizard.skip')} />
        </View>
      )}

      {step === 5 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{t('complaintWizard.reviewAndSubmit')}</Text>
          {phase === 'error' && submitError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}
          <ReviewRow
            label={t('complaintWizard.category')}
            value={category ? t(CATEGORIES.find((c) => c.key === category)?.labelKey ?? '') || category : category}
            onEdit={() => setStep(1)}
          />
          <ReviewRow label={t('complaintWizard.description')} value={description || '—'} onEdit={() => setStep(2)} />
          <ReviewRow
            label={t('complaintWizard.evidence')}
            value={photoUrls.length ? t('complaintWizard.photoCount', { count: photoUrls.length }) : t('complaintWizard.none')}
            onEdit={() => setStep(3)}
          />
          <ReviewRow label={t('complaintWizard.landmark')} value={landmark || t('complaintWizard.notSpecified')} onEdit={() => setStep(4)} />
          <Text style={styles.reviewNote}>{t('complaintWizard.reviewNote')}</Text>
          <Pressable
            disabled={phase === 'submitting'}
            onPress={handleSubmit}
            style={({ pressed }) => [styles.primaryButton, phase === 'submitting' && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonLabel}>{phase === 'submitting' ? t('complaintWizard.submitting') : t('complaintWizard.submitComplaint')}</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.navRow}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonLabel}>{t('complaintWizard.back')}</Text>
      </Pressable>
      <Pressable
        disabled={nextDisabled}
        onPress={onNext}
        style={({ pressed }) => [styles.nextButton, nextDisabled && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.nextButtonLabel}>{nextLabel ?? t('complaintWizard.next')}</Text>
      </Pressable>
    </View>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewText}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
      <Pressable onPress={onEdit} hitSlop={8}>
        <Text style={styles.reviewEdit}>{t('complaintWizard.edit')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', height: 5, marginHorizontal: -16, gap: 0 },
  progressSeg: { flex: 1, backgroundColor: colors.border },
  progressSegDone: { backgroundColor: colors.navy },
  stepMeta: { fontSize: 12, fontFamily: fonts.sansExtraBold, color: colors.muted, marginTop: 10 },
  stepBody: { gap: 14, marginTop: 4 },
  stepTitle: { fontFamily: fonts.serifExtraBold, fontSize: 22, color: colors.text },
  stepSubtitle: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: -8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryTile: { width: '47%', minHeight: 104, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'flex-start', justifyContent: 'center', gap: 11, padding: 16 },
  categoryTileSelected: { borderColor: colors.navy, backgroundColor: colors.navyLight },
  categoryLabel: { fontSize: 14.5, fontFamily: fonts.sansExtraBold, color: colors.text, textAlign: 'left' },
  textarea: { minHeight: 170, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white, padding: 13, fontSize: 14.5, lineHeight: 22, color: colors.text, textAlignVertical: 'top' },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansBold },
  counterWarn: { color: '#8A4A0B' },
  counterWarnText: { fontSize: 12.5, color: '#8A4A0B', fontFamily: fonts.sansBold },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  photoCell: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  photoImage: { width: '100%', height: '100%' },
  addPhotoCell: { width: '31%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.navy, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 5 },
  addPhotoLabel: { fontSize: 10.5, fontFamily: fonts.sansExtraBold, color: colors.navy },
  disabled: { opacity: 0.5 },
  photoTotal: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.muted },
  warnBanner: { padding: 11, borderRadius: 12, backgroundColor: '#FDF3E7', borderWidth: 1, borderColor: '#F0DAB9' },
  warnText: { color: '#8A4A0B', fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 18 },
  errorBanner: { padding: 11, borderRadius: 12, backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#F0C9C9' },
  errorText: { color: '#B42318', fontSize: 13, fontFamily: fonts.sansBold, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 13, minHeight: 50, fontSize: 14.5, color: colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text },
  wardCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  wardCardTitle: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  wardCardHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  backButton: { minHeight: 52, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  backButtonLabel: { fontSize: 15, fontFamily: fonts.sansExtraBold, color: colors.text },
  nextButton: { flex: 1, minHeight: 52, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  nextButtonLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  pressed: { opacity: 0.85 },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  reviewText: { flex: 1 },
  reviewLabel: { fontSize: 11, fontFamily: fonts.sansExtraBold, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.muted },
  reviewValue: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text, marginTop: 5, lineHeight: 19 },
  reviewEdit: { fontSize: 12.5, fontFamily: fonts.sansExtraBold, color: colors.navy },
  reviewNote: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 15 },
  successBadge: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: fonts.serifExtraBold, fontSize: 24, color: colors.text },
  successSubtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  successCard: { width: '100%', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  successCardLabel: { fontSize: 11, fontFamily: fonts.sansExtraBold, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.muted },
  successCardId: { fontFamily: fonts.sansExtraBold, fontSize: 22, color: colors.navy, marginTop: 7 },
  successCardHint: { fontSize: 12.5, color: colors.muted, marginTop: 7, fontFamily: fonts.sansSemibold },
  primaryButton: { width: '100%', minHeight: 52, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  primaryButtonLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.navy },
});
