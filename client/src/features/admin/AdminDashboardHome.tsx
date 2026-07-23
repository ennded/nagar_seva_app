import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { DASHBOARD_STATS, ALL_REQUESTS } from '../../graphql/queries/admin.queries';
import type { DashboardStats, RequestPage, RequestStatus } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';

const STATUS_FILTERS: { label: string; statuses: RequestStatus[] | null }[] = [
  { label: 'All', statuses: null },
  { label: 'Registered', statuses: ['REGISTERED'] },
  { label: 'In Progress', statuses: ['ASSIGNED', 'IN_PROGRESS'] },
  { label: 'Closed', statuses: ['CLOSED'] },
];

export function AdminDashboardHome() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS);
  const [filterIndex, setFilterIndex] = useState(0);
  const { data: recentData } = useQuery<{ allRequests: RequestPage }>(ALL_REQUESTS, {
    variables: { filter: { type: 'COMPLAINT' }, page: 1, limit: 8 },
  });

  const stats = data?.dashboardStats;

  if (loading) return <p>{t('common.loading')}</p>;

  const countFor = (statuses: RequestStatus[]) =>
    stats?.byStatus.filter((s) => statuses.includes(s.status)).reduce((sum, s) => sum + s.count, 0) ?? 0;

  const tiles = [
    { Icon: FileText, value: stats?.totalRequests ?? 0, label: t('admin.dashboard.totalRequests') },
    { Icon: Clock, value: countFor(['REGISTERED']), label: t('admin.dashboard.pendingRequests') },
    { Icon: Activity, value: countFor(['ASSIGNED', 'IN_PROGRESS']), label: 'In Progress' },
    { Icon: CheckCircle2, value: countFor(['CLOSED']), label: 'Closed' },
  ];

  const activeFilter = STATUS_FILTERS[filterIndex];
  const recentRows = (recentData?.allRequests.items ?? []).filter(
    (r) => !activeFilter.statuses || activeFilter.statuses.includes(r.status),
  );

  const maxCategoryCount = Math.max(1, ...(stats?.byCategory.map((c) => c.count) ?? [1]));

  return (
    <div>
      <h1>{t('admin.dashboard.title')}</h1>

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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'start' }}>
        <div className="admin-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Recent Complaints</h2>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {STATUS_FILTERS.map((f, i) => (
                <button
                  key={f.label}
                  type="button"
                  className={`filter-pill${i === filterIndex ? ' active' : ''}`}
                  onClick={() => setFilterIndex(i)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {recentRows.length === 0 ? (
            <p>{t('admin.requests.noResults')}</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('citizen.category')}</th>
                  <th>{t('admin.requests.citizen')}</th>
                  <th>{t('admin.requests.ward')}</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.category ?? r.title}</td>
                    <td>{r.citizen.name}</td>
                    <td>{r.ward.name}</td>
                    <td>
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <Link to={`/${citySlug}/admin/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-panel">
          <h2>Complaints by Category</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', height: 150 }}>
            {(stats?.byCategory ?? []).map((c) => (
              <div key={c.category} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{c.count}</span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 32,
                    borderRadius: '6px 6px 0 0',
                    background: 'var(--color-primary)',
                    height: `${Math.max(6, (c.count / maxCategoryCount) * 100)}%`,
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textAlign: 'center' }}>
                  {c.category}
                </span>
              </div>
            ))}
            {(!stats?.byCategory || stats.byCategory.length === 0) && (
              <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>No complaints yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
