import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import type { RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';

export function MyRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get('q') ?? '').trim().toLowerCase();
  const { data, loading, error } = useQuery<{ myRequests: RequestUnion[] }>(MY_REQUESTS);

  const requests = (data?.myRequests ?? []).filter((r) => {
    if (!searchTerm) return true;
    const label = r.__typename === 'Complaint' ? r.title : r.purpose;
    return label.toLowerCase().includes(searchTerm);
  });

  return (
    <div className="citizen-requests-page">
      <div className="page-header">
        <h1>{t('citizen.myRequests')}</h1>
        <div className="page-header-actions">
          <Link to={`/${citySlug}/citizen/new-complaint`}>{t('citizen.newComplaint')}</Link>
          <Link to={`/${citySlug}/citizen/new-appointment`}>{t('citizen.newAppointment')}</Link>
        </div>
      </div>

      {loading && <Skeleton variant="rows" count={3} />}
      {error && <ErrorState message={error.message} />}
      {!loading && !error && requests.length === 0 && (
        <EmptyState icon={ClipboardList} message={t('citizen.noRequests')} />
      )}

      <ul className="request-list">
        {requests.map((r) => (
          <li key={r.id} className="request-list-item">
            <div>
              <strong>{r.__typename === 'Complaint' ? r.title : r.purpose}</strong>
              <span className="request-meta">
                {t('citizen.submittedOn')} {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <StatusBadge status={r.status} />
            <Link to={`/${citySlug}/citizen/requests/${r.id}`} target="_blank" rel="noopener noreferrer">{t('citizen.viewDetails')}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
