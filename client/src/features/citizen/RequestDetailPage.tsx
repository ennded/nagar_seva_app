import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { REQUEST_DETAIL } from '../../graphql/queries/request.queries';
import type { RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';

export function RequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ request: RequestUnion | null }>(REQUEST_DETAIL, {
    variables: { id },
  });

  if (loading) return <p>{t('common.loading')}</p>;
  if (error) return <p className="form-error">{error.message}</p>;
  if (!data?.request) return <p>Not found.</p>;

  const r = data.request;

  return (
    <div className="request-detail-page">
      <div className="page-header">
        <h1>{r.__typename === 'Complaint' ? r.title : r.purpose}</h1>
        <StatusBadge status={r.status} />
      </div>

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
                <img key={p.url} src={p.url} alt="" />
              ))}
            </div>
          )}
          {r.resolutionRemarks && (
            <p>
              <strong>{t('citizen.resolutionRemarks')}:</strong> {r.resolutionRemarks}
            </p>
          )}
          {r.resolutionProof.length > 0 && (
            <>
              <h3>{t('citizen.resolutionProof')}</h3>
              <div className="photo-preview-list">
                {r.resolutionProof.map((p) => (
                  <img key={p.url} src={p.url} alt="" />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <p>
            <strong>{t('citizen.department')}:</strong> {r.department?.name}
          </p>
          {r.remarks && (
            <p>
              <strong>{t('citizen.remarks')}:</strong> {r.remarks}
            </p>
          )}
          {r.confirmedDate && (
            <p>
              <strong>Confirmed:</strong> {new Date(r.confirmedDate).toLocaleDateString()} ({r.confirmedTimeSlot})
            </p>
          )}
        </>
      )}

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
  );
}
