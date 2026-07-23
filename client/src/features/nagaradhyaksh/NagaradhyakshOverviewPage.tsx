import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { DASHBOARD_STATS } from '../../graphql/queries/admin.queries';
import type { DashboardStats, RequestStatus } from '../../graphql/types';

export function NagaradhyakshOverviewPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS);
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

  const maxCategoryCount = Math.max(1, ...(stats?.byCategory.map((c) => c.count) ?? [1]));

  return (
    <div>
      <h1>{t('monitor.cityTitle')}</h1>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="admin-panel">
          <h2>Complaints by Category</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', height: 150 }}>
            {(stats?.byCategory ?? []).map((c) => (
              <div key={c.category} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{c.count}</span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 32,
                    borderRadius: '6px 6px 0 0',
                    background: 'var(--color-danger)',
                    height: `${Math.max(6, (c.count / maxCategoryCount) * 100)}%`,
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textAlign: 'center' }}>{c.category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <h2>{t('admin.dashboard.byWard')}</h2>
          <table className="admin-table">
            <tbody>
              {stats?.byWard.map((w) => (
                <tr key={w.ward.id}>
                  <td>{w.ward.name}</td>
                  <td>{w.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-panel">
        <h2>{t('admin.dashboard.byDepartment')}</h2>
        <table className="admin-table">
          <tbody>
            {stats?.byDepartment.map((d) => (
              <tr key={d.department.id}>
                <td>{d.department.name}</td>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
