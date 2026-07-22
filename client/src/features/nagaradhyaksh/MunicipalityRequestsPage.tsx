import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { MUNICIPALITY_REQUESTS } from '../../graphql/queries/monitor.queries';
import type { RequestPage, RequestStatus, RequestType } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';

const STATUSES: RequestStatus[] = [
  'REGISTERED',
  'VERIFIED',
  'ASSIGNED',
  'IN_PROGRESS',
  'SCHEDULED',
  'COMPLETED',
  'CLOSED',
  'REJECTED',
];
const TYPES: RequestType[] = ['COMPLAINT', 'APPOINTMENT'];

export function MunicipalityRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, loading, error } = useQuery<{ municipalityRequests: RequestPage }>(MUNICIPALITY_REQUESTS, {
    variables: { filter: { status: status || undefined, type: type || undefined }, page, limit },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.municipalityRequests.total / limit)) : 1;

  return (
    <div>
      <h1>{t('monitor.cityTitle')}</h1>
      <div className="info-banner">{t('monitor.readOnlyNotice')}</div>

      <div className="filter-bar">
        <label>
          {t('admin.requests.filterStatus')}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('admin.requests.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('admin.requests.filterType')}
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('admin.requests.allTypes')}</option>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {ty}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="form-error">{error.message}</p>}

      <div className="admin-panel">
        {data?.municipalityRequests.items.length === 0 ? (
          <p>{t('monitor.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('citizen.title')}</th>
                <th>Status</th>
                <th>{t('admin.requests.citizen')}</th>
                <th>{t('admin.requests.ward')}</th>
                <th>{t('admin.requests.department')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.municipalityRequests.items.map((r) => (
                <tr key={r.id}>
                  <td>{r.__typename === 'Complaint' ? r.title : r.purpose}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.citizen.name}</td>
                  <td>{r.ward.name}</td>
                  <td>{r.department?.name ?? '—'}</td>
                  <td>
                    <Link to={`/${citySlug}/nagaradhyaksh/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.municipalityRequests.total > limit && (
        <div className="action-row">
          <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('common.back')}
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
