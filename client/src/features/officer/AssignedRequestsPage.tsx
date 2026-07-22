import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/officer.queries';
import type { RequestSummary } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';

const ACTIVE_STATUSES = new Set(['ASSIGNED', 'IN_PROGRESS']);

export function AssignedRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const { data, loading, error } = useQuery<{ myAssignedRequests: RequestSummary[] }>(MY_ASSIGNED_REQUESTS);

  const items = (data?.myAssignedRequests ?? []).filter((r) =>
    tab === 'active' ? ACTIVE_STATUSES.has(r.status) || r.status === 'REGISTERED' || r.status === 'VERIFIED' : !ACTIVE_STATUSES.has(r.status),
  );

  return (
    <div>
      <h1>{t('officer.nav.myWork')}</h1>

      <div className="tab-bar">
        <button type="button" className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>
          {t('officer.active')}
        </button>
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          {t('officer.history')}
        </button>
      </div>

      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="form-error">{error.message}</p>}

      {items.length === 0 ? (
        <p>{t('officer.empty')}</p>
      ) : (
        <ul className="request-list">
          {items.map((r) => (
            <li key={r.id} className="request-list-item">
              <div>
                <strong>{r.__typename === 'Complaint' ? r.title : r.purpose}</strong>
                <span className="request-meta">
                  {r.citizen.name} · {r.ward.name}
                </span>
              </div>
              <StatusBadge status={r.status} />
              <Link to={`/${citySlug}/officer/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
