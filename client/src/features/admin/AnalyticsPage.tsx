import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_STATS, DEPARTMENT_PERFORMANCE } from '../../graphql/queries/admin.queries';
import type { DashboardStats, DepartmentPerformance } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { data: statsData, loading: statsLoading } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS);
  const { data: perfData, loading: perfLoading } = useQuery<{ departmentPerformance: DepartmentPerformance[] }>(
    DEPARTMENT_PERFORMANCE,
  );

  const byWard = statsData?.dashboardStats.byWard ?? [];
  const maxWardCount = Math.max(1, ...byWard.map((w) => w.count));
  const departmentPerformance = perfData?.departmentPerformance ?? [];

  return (
    <div>
      <h1>{t('admin.analytics.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('admin.analytics.subtitle')}</p>

      <div className="responsive-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title={t('admin.analytics.wardWiseComplaints')}>
          {statsLoading ? (
            <Skeleton variant="rows" count={4} />
          ) : byWard.length === 0 ? (
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{t('admin.analytics.noWardData')}</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', height: 180, overflowX: 'auto' }}>
              {byWard.map((w) => (
                <div
                  key={w.ward.id}
                  style={{
                    flex: '1 0 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{w.count}</span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 32,
                      borderRadius: '6px 6px 0 0',
                      background: 'var(--color-success)',
                      height: `${Math.max(6, (w.count / maxWardCount) * 100)}%`,
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textAlign: 'center' }}>
                    {w.ward.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={t('admin.analytics.departmentPerformance')}>
          {perfLoading ? (
            <Skeleton variant="rows" count={4} />
          ) : departmentPerformance.length === 0 ? (
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{t('admin.analytics.noDepartmentData')}</p>
          ) : (
            departmentPerformance.map((d) => (
              <div className="progress-row" key={d.department.id}>
                <div className="progress-row-label">
                  <span>{d.department.name}</span>
                  <span>{d.resolutionRate}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${d.resolutionRate}%` }} />
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
