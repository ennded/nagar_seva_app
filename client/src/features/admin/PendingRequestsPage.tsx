import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { PENDING_REQUESTS } from '../../graphql/queries/admin.queries';
import type { RequestSummary } from '../../graphql/types';

export function PendingRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading, error } = useQuery<{ pendingRequests: RequestSummary[] }>(PENDING_REQUESTS);

  return (
    <div>
      <div className="page-header">
        <h1>{t('admin.requests.pendingTitle')}</h1>
        <Link to={`/${citySlug}/admin/requests/all`}>{t('admin.requests.allTitle')}</Link>
      </div>

      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="form-error">{error.message}</p>}

      <div className="admin-panel">
        {data?.pendingRequests.length === 0 ? (
          <p>{t('admin.requests.noPending')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('citizen.title')}</th>
                <th>{t('admin.requests.citizen')}</th>
                <th>{t('admin.requests.ward')}</th>
                <th>{t('admin.requests.submittedOn')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.pendingRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.__typename === 'Complaint' ? r.title : r.purpose}</td>
                  <td>{r.citizen.name}</td>
                  <td>{r.ward.name}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/${citySlug}/admin/requests/${r.id}`} target="_blank" rel="noopener noreferrer">{t('admin.requests.viewDetail')}</Link>
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
