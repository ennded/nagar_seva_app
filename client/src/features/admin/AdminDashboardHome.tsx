import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_STATS } from '../../graphql/queries/admin.queries';
import { PENDING_REQUESTS } from '../../graphql/queries/admin.queries';
import type { DashboardStats, RequestSummary } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';

export function AdminDashboardHome() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS);
  const { data: pendingData } = useQuery<{ pendingRequests: RequestSummary[] }>(PENDING_REQUESTS);

  const stats = data?.dashboardStats;
  const pendingCount = pendingData?.pendingRequests.length ?? 0;

  if (loading) return <p>{t('common.loading')}</p>;

  return (
    <div>
      <h1>{t('admin.dashboard.title')}</h1>

      <section className="stats-row">
        <div className="stat-tile">
          <strong>{stats?.totalRequests ?? 0}</strong>
          <span>{t('admin.dashboard.totalRequests')}</span>
        </div>
        <div className="stat-tile">
          <strong>{pendingCount}</strong>
          <span>{t('admin.dashboard.pendingRequests')}</span>
        </div>
      </section>

      {pendingCount > 0 && (
        <div className="action-row">
          <Link to={`/${citySlug}/admin/requests`}>{t('admin.dashboard.viewPending')}</Link>
        </div>
      )}

      <div className="admin-panel">
        <h2>{t('admin.dashboard.byStatus')}</h2>
        <table className="admin-table">
          <tbody>
            {stats?.byStatus.map((s) => (
              <tr key={s.status}>
                <td>
                  <StatusBadge status={s.status} />
                </td>
                <td>{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
  );
}
