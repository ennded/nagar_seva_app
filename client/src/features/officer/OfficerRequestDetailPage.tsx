import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { REQUEST_DETAIL } from '../../graphql/queries/request.queries';
import { COMPLETE_COMPLAINT, SCHEDULE_APPOINTMENT, START_WORK } from '../../graphql/mutations/officer.mutations';
import type { RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { FilePreview } from '../../components/FilePreview';
import { uploadComplaintPhoto } from '../../apollo/upload';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

const TIME_SLOTS = ['9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM'];

export function OfficerRequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { data, loading, error, refetch } = useQuery<{ request: RequestUnion | null }>(REQUEST_DETAIL, {
    variables: { id },
  });

  const [startWork, { loading: starting }] = useMutation(START_WORK);
  const [completeComplaint, { loading: completing }] = useMutation(COMPLETE_COMPLAINT);
  const [scheduleAppointment, { loading: scheduling }] = useMutation(SCHEDULE_APPOINTMENT);

  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [confirmedDate, setConfirmedDate] = useState('');
  const [confirmedTimeSlot, setConfirmedTimeSlot] = useState('');

  if (loading) return <Skeleton variant="rows" count={5} />;
  if (error) return <ErrorState message={error.message} />;
  if (!data?.request) return <EmptyState message={t('officer.notFound', { defaultValue: 'Not found.' })} />;

  const r = data.request;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadComplaintPhoto));
      setProofUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleStartWork() {
    await startWork({ variables: { id } });
    refetch();
  }

  async function handleComplete() {
    await completeComplaint({ variables: { id, resolutionProofUrls: proofUrls, remarks: remarks || undefined } });
    setProofUrls([]);
    setRemarks('');
    refetch();
  }

  async function handleSchedule() {
    await scheduleAppointment({ variables: { id, confirmedDate, confirmedTimeSlot } });
    refetch();
  }

  return (
    <div>
      <div className="page-header">
        <h1>{r.__typename === 'Complaint' ? r.title : r.purpose}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={r.status} />
          <PriorityBadge priority={r.priority} />
        </div>
      </div>

      <div className="responsive-grid-2" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="admin-panel">
            <p>
              <strong>{t('admin.requests.citizen')}:</strong> {r.citizen.name} ({r.citizen.mobile})
            </p>
            <p>
              <strong>{t('admin.requests.ward')}:</strong> {r.ward.name}
            </p>
            {r.__typename === 'Complaint' ? (
              <>
                <p>
                  <strong>{t('citizen.category')}:</strong> {r.category}
                </p>
                <p>
                  <strong>{t('citizen.description')}:</strong> {r.description}
                </p>
                <p>
                  <strong>{t('citizen.address')}:</strong> {r.address}
                </p>
                {r.photos.length > 0 && (
                  <div className="photo-preview-list">
                    {r.photos.map((p) => (
                      <FilePreview key={p.url} url={p.url} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>{r.remarks && (
                <p>
                  <strong>{t('citizen.remarks')}:</strong> {r.remarks}
                </p>
              )}</>
            )}
          </div>

          <div className="admin-panel">
            <h3>{t('citizen.statusHistory')}</h3>
            <ul className="status-history">
              {r.statusHistory.map((event, i) => (
                <li key={i}>
                  <StatusBadge status={event.status} /> — {new Date(event.changedAt).toLocaleString()}
                  {event.changedBy && ` (${event.changedBy.name})`}
                  {event.note && <p>{event.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {r.__typename === 'Complaint' && r.status === 'ASSIGNED' && (
            <div className="admin-panel">
              <h2>{t('officer.startWork')}</h2>
              <div className="action-row">
                <button type="button" onClick={handleStartWork} disabled={starting}>
                  {t('officer.startWork')}
                </button>
              </div>
            </div>
          )}

          {r.__typename === 'Complaint' && r.status === 'IN_PROGRESS' && (
            <div className="admin-panel">
              <h2>{t('officer.complete')}</h2>
              <label>
                {t('officer.resolutionProof')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,video/quicktime"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
              {uploading && <p>{t('common.loading')}</p>}
              {uploadError && <p className="form-error">{uploadError}</p>}
              {proofUrls.length > 0 && (
                <div className="photo-preview-list">
                  {proofUrls.map((url) => (
                    <FilePreview key={url} url={url} />
                  ))}
                </div>
              )}
              <label>
                {t('citizen.resolutionRemarks')}
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </label>
              {proofUrls.length === 0 && !uploading && <p className="form-error">{t('officer.proofRequired')}</p>}
              <div className="action-row">
                <button
                  type="button"
                  className="btn-success"
                  onClick={handleComplete}
                  disabled={completing || uploading || proofUrls.length === 0}
                >
                  {t('officer.complete')}
                </button>
              </div>
            </div>
          )}

          {r.__typename === 'Appointment' && r.status === 'ASSIGNED' && (
            <div className="admin-panel">
              <h2>{t('officer.confirmSchedule')}</h2>
              <label>
                {t('officer.confirmedDate')}
                <input type="date" value={confirmedDate} onChange={(e) => setConfirmedDate(e.target.value)} required />
              </label>
              <label>
                {t('officer.confirmedTimeSlot')}
                <select value={confirmedTimeSlot} onChange={(e) => setConfirmedTimeSlot(e.target.value)} required>
                  <option value="" disabled>
                    {t('officer.selectTimeSlot')}
                  </option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <div className="action-row">
                <button
                  type="button"
                  className="btn-success"
                  onClick={handleSchedule}
                  disabled={scheduling || !confirmedDate || !confirmedTimeSlot}
                >
                  {t('officer.confirmSchedule')}
                </button>
              </div>
            </div>
          )}

          {(r.status === 'COMPLETED' || r.status === 'SCHEDULED' || r.status === 'CLOSED') && (
            <div className="info-banner">{t('officer.waitingReview')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
