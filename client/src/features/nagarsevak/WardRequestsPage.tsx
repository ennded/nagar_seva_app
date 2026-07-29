import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { WARD_REQUESTS } from '../../graphql/queries/monitor.queries';
import type { RequestSummary } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';

export function WardRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading, error } = useQuery<{ wardRequests: RequestSummary[] }>(WARD_REQUESTS);
  const items = data?.wardRequests ?? [];

  const tiles = [
    { Icon: ClipboardList, value: items.length, label: t('admin.dashboard.totalRequests') },
    { Icon: Clock, value: items.filter((r) => r.status === 'REGISTERED').length, label: 'Registered' },
    { Icon: Activity, value: items.filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS').length, label: 'In Progress' },
    { Icon: CheckCircle2, value: items.filter((r) => r.status === 'CLOSED').length, label: 'Closed' },
  ];

  return (
    <div>
      <h1>{t('monitor.wardTitle')}</h1>
      <div className="info-banner">{t('monitor.readOnlyNotice')}</div>

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

      {loading && (
        <Card>
          <Skeleton variant="rows" count={5} />
        </Card>
      )}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && (
        <Card>
          {items.length === 0 ? (
            <EmptyState icon={ClipboardList} message={t('monitor.empty')} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>{t('citizen.title')}</th>
                  <th>{t('admin.requests.citizen')}</th>
                  <th>Priority</th>
                  <th>{t('admin.requests.department')}</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.__typename === 'Complaint' ? (r.category ?? r.title) : r.purpose}</td>
                    <td>{r.citizen.name}</td>
                    <td>
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td>{r.department?.name ?? '—'}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <Link to={`/${citySlug}/nagarsevak/requests/${r.id}`} target="_blank" rel="noopener noreferrer">
                        {t('admin.requests.viewDetail')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
