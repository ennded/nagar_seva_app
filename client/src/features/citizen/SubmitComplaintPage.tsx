import { useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft, Image as ImageIcon, Mic, Video as VideoIcon, X } from 'lucide-react';
import { SUBMIT_COMPLAINT } from '../../graphql/mutations/request.mutations';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import { uploadComplaintPhoto } from '../../apollo/upload';
import { FilePreview } from '../../components/FilePreview';
import { Button } from '../../components/ui/Button';
import { NAVY, NAVY_LIGHT, GREEN, GREEN_LIGHT, TEXT, MUTED, BORDER } from '../landing/palette';
import { COMPLAINT_CATEGORIES, CATEGORY_ICON, type ComplaintCategory } from './categoryIcons';
import { formatComplaintId } from './complaintId';

const STEP_NUMBERS = [1, 2, 3, 4, 5] as const;
type Step = (typeof STEP_NUMBERS)[number];
const STEP_KEYS = ['category', 'remarks', 'upload', 'location', 'review'] as const;

const DESCRIPTION_MAX = 300;

function useSpeechToText(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const SpeechRecognitionCtor =
    typeof window !== 'undefined' ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition : undefined;

  function toggle() {
    if (!SpeechRecognitionCtor) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => onResult(e.results[0][0].transcript as string);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return { supported: Boolean(SpeechRecognitionCtor), listening, toggle };
}

export function SubmitComplaintPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<ComplaintCategory>('garbage');
  const [description, setDescription] = useState('');
  const [landmark, setLandmark] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Complaint | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: requestsData } = useQuery<{ myRequests: RequestUnion[] }>(MY_REQUESTS);
  const [submitComplaint, { loading, error }] = useMutation<{ submitComplaint: Complaint }>(SUBMIT_COMPLAINT, {
    refetchQueries: [{ query: MY_REQUESTS }],
    awaitRefetchQueries: true,
  });

  const { supported: speechSupported, listening, toggle: toggleSpeech } = useSpeechToText((text) => {
    setDescription((prev) => (prev ? `${prev} ${text}` : text).slice(0, DESCRIPTION_MAX));
  });

  async function handleUpload(files: FileList | null, kind: 'photo' | 'video') {
    if (!files || files.length === 0) return;
    const setUploading = kind === 'photo' ? setUploadingPhoto : setUploadingVideo;
    const setUrls = kind === 'photo' ? setPhotoUrls : setVideoUrls;
    setUploading(true);
    setUploadError(null);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadComplaintPhoto));
      setUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeUrl(kind: 'photo' | 'video', url: string) {
    const setUrls = kind === 'photo' ? setPhotoUrls : setVideoUrls;
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  function goNext() {
    setStep((s) => (s < 5 ? ((s + 1) as Step) : s));
  }
  function goBack() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = t(`citizen.categories.${category}`);
    const address = landmark.trim() || t('citizen.newComplaintWizard.noLandmark');
    const { data } = await submitComplaint({
      variables: {
        input: { title, category, description, address, photoUrls: [...photoUrls, ...videoUrls] },
      },
    });
    if (data) setSubmitted(data.submitComplaint);
  }

  const canGoNext = step === 2 ? description.trim().length > 0 : true;

  if (submitted) {
    const complaints = (requestsData?.myRequests ?? []).filter((r): r is Complaint => r.__typename === 'Complaint');
    const displayId = formatComplaintId(complaints.length || 1);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: GREEN_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Check size={32} color={GREEN} />
        </div>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 800, color: TEXT }}>
          {t('citizen.newComplaintWizard.registeredTitle')}
        </div>
        <div style={{ fontSize: 14, color: MUTED, marginTop: 8, maxWidth: 420 }}>
          {t('citizen.newComplaintWizard.registeredSubtitle')}
        </div>
        <div style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, marginTop: 24, width: '100%', maxWidth: 360, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
            <span style={{ color: MUTED }}>{t('citizen.newComplaintWizard.complaintId')}</span>
            <span style={{ fontWeight: 800, color: TEXT }}>{displayId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
            <span style={{ color: MUTED }}>{t('citizen.category')}</span>
            <span style={{ fontWeight: 800, color: TEXT }}>{t(`citizen.categories.${category}`)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Button onClick={() => navigate(`/${citySlug}/citizen/requests/${submitted.id}`)}>
            {t('citizen.newComplaintWizard.trackThis')}
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/${citySlug}/citizen`)}>
            {t('citizen.newComplaintWizard.backToHome')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          type="button"
          onClick={() => navigate(`/${citySlug}/citizen`)}
          aria-label={t('common.back')}
          style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 'unset', boxShadow: 'none' }}
        >
          <ChevronLeft size={18} color={TEXT} />
        </button>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 800, color: TEXT }}>
          {t('citizenHome.quickActions.registerComplaint.title')}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
        {STEP_NUMBERS.map((n) => {
          const done = n < step;
          const current = n === step;
          const clickable = n < step;
          return (
            <button
              key={n}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && setStep(n)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                minHeight: 'unset',
                padding: 0,
                cursor: clickable ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 800,
                  background: done ? GREEN : current ? NAVY : '#FFFFFF',
                  color: done || current ? '#FFFFFF' : MUTED,
                  border: done || current ? 'none' : `1px solid ${BORDER}`,
                }}
              >
                {n}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: current ? NAVY : MUTED }}>
                {t(`citizen.newComplaintWizard.steps.${STEP_KEYS[n - 1]}`)}
              </div>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          alignItems: 'center',
          width: '100%',
          maxWidth: 'none',
          background: 'transparent',
          padding: 0,
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
        }}
      >
        <div style={{ width: '100%', maxWidth: 640 }}>
          {step === 1 && (
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 18, textAlign: 'center' }}>
                {t('citizen.newComplaintWizard.step1Title')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {COMPLAINT_CATEGORIES.map((c) => {
                  const Icon = CATEGORY_ICON[c];
                  const selected = c === category;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCategory(c);
                        goNext();
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        padding: '22px 12px',
                        borderRadius: 14,
                        border: selected ? `2px solid ${NAVY}` : `1px solid ${BORDER}`,
                        background: selected ? NAVY_LIGHT : '#FFFFFF',
                        cursor: 'pointer',
                        minHeight: 'unset',
                        boxShadow: 'none',
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: NAVY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={22} color={NAVY} />
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT }}>{t(`citizen.categories.${c}`)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: NAVY_LIGHT, color: NAVY, borderRadius: 100, padding: '6px 12px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                {t(`citizen.categories.${category}`)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 12 }}>
                {t('citizen.newComplaintWizard.step2Title')}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                maxLength={DESCRIPTION_MAX}
                placeholder={t('citizen.newComplaintWizard.descriptionPlaceholder') ?? ''}
                style={{ width: '100%', minHeight: 160, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                {speechSupported ? (
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', boxShadow: 'none', minHeight: 'unset', padding: 0, color: NAVY, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
                  >
                    <Mic size={15} color={listening ? '#DC2626' : NAVY} />
                    {listening ? t('citizen.newComplaintWizard.listening') : t('citizen.newComplaintWizard.speakInstead')}
                  </button>
                ) : (
                  <span />
                )}
                <span style={{ fontSize: 12, color: MUTED }}>
                  {description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 18 }}>
                {t('citizen.newComplaintWizard.step3Title')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{t('citizen.newComplaintWizard.photoLabel')}</div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={(e) => handleUpload(e.target.files, 'photo')}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    style={{
                      width: '100%',
                      minHeight: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      borderRadius: 12,
                      border: `1px dashed ${BORDER}`,
                      background: '#F6F8FA',
                      cursor: 'pointer',
                      boxShadow: 'none',
                    }}
                  >
                    <ImageIcon size={26} color={MUTED} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, textAlign: 'center' }}>
                      {t('citizen.newComplaintWizard.photoHint')}
                      <br />
                      <span style={{ color: NAVY, textDecoration: 'underline' }}>{t('citizen.newComplaintWizard.browseFiles')}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>{t('citizen.newComplaintWizard.maxFileSize')}</div>
                  </button>
                  {photoUrls.length > 0 && (
                    <ul className="photo-preview-list" style={{ marginTop: 10 }}>
                      {photoUrls.map((url) => (
                        <li key={url} style={{ position: 'relative', listStyle: 'none' }}>
                          <FilePreview url={url} />
                          <button
                            type="button"
                            onClick={() => removeUrl('photo', url)}
                            aria-label={t('common.cancel')}
                            style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#DC2626', color: '#FFFFFF', border: 'none', boxShadow: 'none', minHeight: 'unset', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={11} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{t('citizen.newComplaintWizard.videoLabel')}</div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    multiple
                    hidden
                    onChange={(e) => handleUpload(e.target.files, 'video')}
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    style={{
                      width: '100%',
                      minHeight: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      borderRadius: 12,
                      border: `1px dashed ${BORDER}`,
                      background: '#F6F8FA',
                      cursor: 'pointer',
                      boxShadow: 'none',
                    }}
                  >
                    <VideoIcon size={26} color={MUTED} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, textAlign: 'center' }}>
                      {t('citizen.newComplaintWizard.videoHint')}
                    </div>
                    <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>{t('citizen.newComplaintWizard.maxFileSize')}</div>
                  </button>
                  {videoUrls.length > 0 && (
                    <ul className="photo-preview-list" style={{ marginTop: 10 }}>
                      {videoUrls.map((url) => (
                        <li key={url} style={{ position: 'relative', listStyle: 'none' }}>
                          <FilePreview url={url} />
                          <button
                            type="button"
                            onClick={() => removeUrl('video', url)}
                            aria-label={t('common.cancel')}
                            style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#DC2626', color: '#FFFFFF', border: 'none', boxShadow: 'none', minHeight: 'unset', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={11} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {(uploadingPhoto || uploadingVideo) && <p style={{ fontSize: 13, color: MUTED, marginTop: 12 }}>{t('common.loading')}</p>}
              {uploadError && <p className="form-error" style={{ marginTop: 12 }}>{uploadError}</p>}
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 18 }}>
                {t('citizen.newComplaintWizard.step4Title')}
              </div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 8 }}>
                {t('citizen.newComplaintWizard.landmarkLabel')}
              </label>
              <input
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder={t('citizen.newComplaintWizard.landmarkPlaceholder') ?? ''}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {step === 5 && (
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 18 }}>
                {t('citizen.newComplaintWizard.step5Title')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ReviewRow label={t('citizen.category')} value={t(`citizen.categories.${category}`)} onEdit={() => setStep(1)} editLabel={t('citizen.newComplaintWizard.edit')} />
                <ReviewRow label={t('citizen.newComplaintWizard.steps.remarks')} value={description || '—'} onEdit={() => setStep(2)} editLabel={t('citizen.newComplaintWizard.edit')} />
                <ReviewRow
                  label={t('citizen.newComplaintWizard.steps.upload')}
                  value={
                    photoUrls.length + videoUrls.length > 0
                      ? t('citizen.newComplaintWizard.filesAdded', { count: photoUrls.length + videoUrls.length })
                      : t('citizen.newComplaintWizard.noPhotos')
                  }
                  onEdit={() => setStep(3)}
                  editLabel={t('citizen.newComplaintWizard.edit')}
                />
                <ReviewRow
                  label={t('citizen.newComplaintWizard.steps.location')}
                  value={landmark.trim() || t('citizen.newComplaintWizard.noLandmark')}
                  onEdit={() => setStep(4)}
                  editLabel={t('citizen.newComplaintWizard.edit')}
                />
              </div>
              {error && <p className="form-error" style={{ marginTop: 16 }}>{error.message}</p>}
              <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 20 }}>
                {t('citizen.newComplaintWizard.submit')}
              </Button>
            </div>
          )}
        </div>

        {step < 5 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 640 }}>
            <Button type="button" variant="secondary" onClick={goBack} disabled={step === 1} style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>
              {t('common.back')}
            </Button>
            <Button type="button" onClick={goNext} disabled={!canGoNext}>
              {t('common.next')}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

function ReviewRow({ label, value, onEdit, editLabel }: { label: string; value: string; onEdit: () => void; editLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px' }}>
      <div>
        <div style={{ fontSize: 12, color: MUTED }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginTop: 2 }}>{value}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        style={{ background: 'transparent', border: 'none', boxShadow: 'none', minHeight: 'unset', padding: 0, color: NAVY, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
      >
        {editLabel}
      </button>
    </div>
  );
}
