import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_STATS } from '../../graphql/queries/admin.queries';
import type { DashboardStats } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';

export function NagaradhyakshOverviewPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS);
  const stats = data?.dashboardStats;

  if (loading) return <p>{t('common.loading')}</p>;

  return (
    <div>
      <h1>{t('monitor.cityTitle')}</h1>
      <div className="info-banner">{t('monitor.readOnlyNotice')}</div>

      <section className="stats-row">
        <div className="stat-tile">
          <strong>{stats?.totalRequests ?? 0}</strong>
          <span>{t('admin.dashboard.totalRequests')}</span>
        </div>
      </section>

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
