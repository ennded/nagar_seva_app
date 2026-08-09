import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/officer.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { CATEGORY_ICON, type ComplaintCategory } from '../citizen/categoryIcons';
import { shortRequestId } from '../../utils/requestId';

const ACTIVE_STATUSES = new Set(['ASSIGNED', 'IN_PROGRESS']);

export function MyComplaintsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const { data, loading, error } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS);

  const all = (data?.myAssignedRequests ?? []).filter((r): r is Complaint => r.__typename === 'Complaint');
  const items = all.filter((r) => (tab === 'active' ? ACTIVE_STATUSES.has(r.status) : !ACTIVE_STATUSES.has(r.status)));

  const tiles = [
    { Icon: ClipboardList, value: all.length, label: t('officer.nav.myComplaints') },
    { Icon: Clock, value: all.filter((r) => r.status === 'ASSIGNED').length, label: t('officer.notStarted') },
    { Icon: Activity, value: all.filter((r) => r.status === 'IN_PROGRESS').length, label: t('officer.inProgress') },
    { Icon: CheckCircle2, value: all.filter((r) => r.status === 'COMPLETED' || r.status === 'CLOSED').length, label: t('officer.completed') },
  ];

  return (
    <div>
      <h1>{t('officer.nav.myComplaints')}</h1>

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

      {loading && <Skeleton variant="rows" count={4} />}
      {error && <ErrorState message={error.message} />}

      {!loading &&
        !error &&
        (items.length === 0 ? (
          <EmptyState icon={ClipboardList} message={t('officer.empty')} />
        ) : (
          <ul className="request-list">
            {items.map((r) => {
              const CategoryIcon = CATEGORY_ICON[r.category as ComplaintCategory] ?? ClipboardList;
              return (
                <li key={r.id} className="request-list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F1F4F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CategoryIcon size={20} color="#14181C" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong>
                        {t(`citizen.categories.${r.category}`, r.category)} · {shortRequestId(r.id)}
                      </strong>
                      <span className="request-meta">
                        {r.citizen.name} · {r.address}, {r.ward.name}
                      </span>
                    </div>
                  </div>
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                  <Link to={`/${citySlug}/officer/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
                </li>
              );
            })}
          </ul>
        ))}
    </div>
  );
}
