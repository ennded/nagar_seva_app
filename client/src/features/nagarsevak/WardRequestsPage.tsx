import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { WARD_REQUESTS } from '../../graphql/queries/monitor.queries';
import type { RequestSummary } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';

export function WardRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading, error } = useQuery<{ wardRequests: RequestSummary[] }>(WARD_REQUESTS);

  return (
    <div>
      <h1>{t('monitor.wardTitle')}</h1>
      <div className="info-banner">{t('monitor.readOnlyNotice')}</div>

      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="form-error">{error.message}</p>}

      <div className="admin-panel">
        {data?.wardRequests.length === 0 ? (
          <p>{t('monitor.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('citizen.title')}</th>
                <th>Status</th>
                <th>{t('admin.requests.citizen')}</th>
                <th>{t('admin.requests.department')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.wardRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.__typename === 'Complaint' ? r.title : r.purpose}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.citizen.name}</td>
                  <td>{r.department?.name ?? '—'}</td>
                  <td>
                    <Link to={`/${citySlug}/nagarsevak/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
