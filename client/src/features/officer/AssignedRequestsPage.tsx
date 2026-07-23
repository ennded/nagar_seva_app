import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/officer.queries';
import type { RequestSummary } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';

const ACTIVE_STATUSES = new Set(['ASSIGNED', 'IN_PROGRESS']);

export function AssignedRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const { data, loading, error } = useQuery<{ myAssignedRequests: RequestSummary[] }>(MY_ASSIGNED_REQUESTS);

  const all = data?.myAssignedRequests ?? [];
  const items = all.filter((r) => (tab === 'active' ? ACTIVE_STATUSES.has(r.status) : !ACTIVE_STATUSES.has(r.status)));

  const tiles = [
    { Icon: ClipboardList, value: all.length, label: t('officer.nav.myWork') },
    { Icon: Clock, value: all.filter((r) => r.status === 'ASSIGNED').length, label: 'Not Started' },
    { Icon: Activity, value: all.filter((r) => r.status === 'IN_PROGRESS').length, label: 'In Progress' },
    { Icon: CheckCircle2, value: all.filter((r) => r.status === 'COMPLETED' || r.status === 'CLOSED').length, label: 'Completed' },
  ];

  return (
    <div>
      <h1>{t('officer.nav.myWork')}</h1>

      <section className="stats-row">
        {tiles.map((tile) => (
          <div key={tile.label} className="stat-tile">
            <div className="stat-tile-icon">
              <tile.Icon size={20} color="#0B3D66" />
            </div>
            <strong>{tile.value}</strong>
            <span>{tile.label}</span>
          </div>
        ))}
      </section>

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
                <strong>{r.__typename === 'Complaint' ? (r.category ?? r.title) : r.purpose}</strong>
                <span className="request-meta">
                  {r.citizen.name} · {r.ward.name}
                </span>
              </div>
              <PriorityBadge priority={r.priority} />
              <StatusBadge status={r.status} />
              <Link to={`/${citySlug}/officer/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
