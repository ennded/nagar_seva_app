import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import type { RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';

export function MyRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading, error } = useQuery<{ myRequests: RequestUnion[] }>(MY_REQUESTS);

  return (
    <div className="citizen-requests-page">
      <div className="page-header">
        <h1>{t('citizen.myRequests')}</h1>
        <div className="page-header-actions">
          <Link to={`/${citySlug}/citizen/new-complaint`}>{t('citizen.newComplaint')}</Link>
          <Link to={`/${citySlug}/citizen/new-appointment`}>{t('citizen.newAppointment')}</Link>
        </div>
      </div>

      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="form-error">{error.message}</p>}
      {data?.myRequests.length === 0 && <p>{t('citizen.noRequests')}</p>}

      <ul className="request-list">
        {data?.myRequests.map((r) => (
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
