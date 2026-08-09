import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, ChevronLeft, ClipboardList } from 'lucide-react';
import { REQUEST_DETAIL, MY_REQUESTS } from '../../graphql/queries/request.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { FilePreview } from '../../components/FilePreview';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { CATEGORY_ICON, type ComplaintCategory } from './categoryIcons';
import { formatComplaintId } from './complaintId';
import { NAVY, TEXT, MUTED, BORDER } from '../landing/palette';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';

export function RequestDetailPage() {
  const { t } = useTranslation();
  const { citySlug, id } = useParams<{ citySlug: string; id: string }>();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery<{ request: RequestUnion | null }>(REQUEST_DETAIL, {
    variables: { id },
  });
  const { data: listData } = useQuery<{ myRequests: RequestUnion[] }>(MY_REQUESTS);
  useRefetchOnFocus(refetch);

  if (loading) return <Skeleton variant="rows" count={5} />;
  if (error) return <ErrorState message={error.message} />;
  if (!data?.request) return <EmptyState message={t('citizen.requestNotFound')} />;

  const r = data.request;
  const isComplaint = r.__typename === 'Complaint';

  const Icon = isComplaint ? CATEGORY_ICON[r.category as ComplaintCategory] ?? ClipboardList : CalendarPlus;

  const complaintsSortedByAge = (listData?.myRequests ?? [])
    .filter((x): x is Complaint => x.__typename === 'Complaint')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const sequenceNumber = isComplaint ? complaintsSortedByAge.findIndex((c) => c.id === r.id) + 1 : 0;

  const title = isComplaint ? t(`citizen.categories.${r.category}`, r.category) : r.purpose;
  const submittedOn = new Date(r.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate(`/${citySlug}/citizen/requests`)}
        aria-label={t('common.back')}
        style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 'unset', boxShadow: 'none', flexShrink: 0 }}
      >
        <ChevronLeft size={18} color={TEXT} />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F1F4F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={24} color={NAVY} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 800, color: TEXT }}>{title}</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
              {isComplaint && sequenceNumber > 0 && `${formatComplaintId(sequenceNumber)} · `}
              {t('citizen.submittedOn')} {submittedOn}
              {r.ward?.name ? ` · ${r.ward.name}` : ''}
            </div>
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isComplaint ? (
          <>
            <DetailRow label={t('citizen.description')} value={r.description} />
            <DetailRow label={t('citizen.address')} value={r.address} />
            {r.photos.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>{t('citizen.evidence')}</div>
                <ul className="photo-preview-list">
                  {r.photos.map((p) => (
                    <li key={p.url} style={{ listStyle: 'none' }}>
                      <FilePreview url={p.url} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <>
            <DetailRow label={t('citizen.department')} value={r.department?.name ?? '—'} />
            {r.remarks && <DetailRow label={t('citizen.remarks')} value={r.remarks} />}
            {r.confirmedDate && (
              <DetailRow
                label={t('citizen.confirmedDate')}
                value={`${new Date(r.confirmedDate).toLocaleDateString()}${r.confirmedTimeSlot ? ` · ${r.confirmedTimeSlot}` : ''}`}
              />
            )}
          </>
        )}
      </div>

      {isComplaint && (r.resolutionRemarks || r.resolutionProof.length > 0) && (
        <div style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {r.resolutionRemarks && <DetailRow label={t('citizen.resolutionRemarks')} value={r.resolutionRemarks} />}
          {r.resolutionProof.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>{t('citizen.resolutionProof')}</div>
              <ul className="photo-preview-list">
                {r.resolutionProof.map((p) => (
                  <li key={p.url} style={{ listStyle: 'none' }}>
                    <FilePreview url={p.url} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 10 }}>{t('citizen.statusHistory')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {r.statusHistory.map((event, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px' }}>
              <StatusBadge status={event.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: TEXT }}>
                  {new Date(event.changedAt).toLocaleString()}
                  {event.changedBy && ` · ${event.changedBy.name}`}
                </div>
                {event.note && <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{event.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 14.5, color: TEXT, marginTop: 3, lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}
