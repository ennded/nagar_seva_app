import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { DEPARTMENT_PERFORMANCE } from '../../graphql/queries/admin.queries';
import type { DepartmentPerformance } from '../../graphql/types';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export function DepartmentPerformancePage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ departmentPerformance: DepartmentPerformance[] }>(DEPARTMENT_PERFORMANCE);
  const departments = data?.departmentPerformance ?? [];

  return (
    <div>
      <h1>{t('nagaradhyaksh.departmentPerformance.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>
        {t('nagaradhyaksh.departmentPerformance.subtitle')}
      </p>

      {loading ? (
        <div className="report-grid">
          <Skeleton variant="rows" count={4} />
          <Skeleton variant="rows" count={4} />
          <Skeleton variant="rows" count={4} />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState icon={Building2} message={t('nagaradhyaksh.departmentPerformance.noData')} />
      ) : (
        <div className="report-grid">
          {departments.map((d) => (
            <div key={d.department.id} className="report-card">
              <div className="report-card-icon">
                <Building2 size={20} color="var(--color-primary)" />
              </div>
              <h3>{d.department.name}</h3>
              <div className="progress-row">
                <div className="progress-row-label">
                  <span>{t('nagaradhyaksh.departmentPerformance.assigned')}</span>
                  <span>{d.totalRequests}</span>
                </div>
                <div className="progress-row-label">
                  <span>{t('nagaradhyaksh.departmentPerformance.resolved')}</span>
                  <span>{d.resolvedRequests}</span>
                </div>
                <div className="progress-row-label">
                  <span>{t('nagaradhyaksh.departmentPerformance.pending')}</span>
                  <span>{d.totalRequests - d.resolvedRequests}</span>
                </div>
                <div className="progress-row-label">
                  <span>{t('nagaradhyaksh.departmentPerformance.avgResolutionTime')}</span>
                  <span>
                    {d.avgResolutionDays != null
                      ? t('nagaradhyaksh.wardPerformance.days', { count: d.avgResolutionDays })
                      : '—'}
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${d.resolutionRate}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
