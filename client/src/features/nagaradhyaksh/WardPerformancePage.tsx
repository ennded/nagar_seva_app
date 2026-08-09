import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { WARD_PERFORMANCE } from '../../graphql/queries/admin.queries';
import type { WardPerformance } from '../../graphql/types';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export function WardPerformancePage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ wardPerformance: WardPerformance[] }>(WARD_PERFORMANCE);
  const wards = data?.wardPerformance ?? [];

  return (
    <div>
      <h1>{t('nagaradhyaksh.wardPerformance.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('nagaradhyaksh.wardPerformance.subtitle')}</p>

      {loading ? (
        <div className="report-grid">
          <Skeleton variant="rows" count={4} />
          <Skeleton variant="rows" count={4} />
          <Skeleton variant="rows" count={4} />
        </div>
      ) : wards.length === 0 ? (
        <EmptyState icon={MapPin} message={t('nagaradhyaksh.wardPerformance.noData')} />
      ) : (
        <div className="report-grid">
          {wards.map((w) => (
            <div key={w.ward.id} className="report-card">
              <h3>{w.ward.name}</h3>
              <div className="progress-row">
                <div className="progress-row-label">
                  <span>{t('nagaradhyaksh.wardPerformance.totalComplaints')}</span>
                  <span>{w.totalComplaints}</span>
                </div>
                <div className="progress-row-label">
                  <span>{t('nagaradhyaksh.wardPerformance.pending')}</span>
                  <span>{w.pending}</span>
                </div>
                <div className="progress-row-label">
                  <span>{t('nagaradhyaksh.wardPerformance.resolutionRate')}</span>
                  <span>{w.resolutionRate}%</span>
                </div>
                <div className="progress-row-label">
                  <span>{t('nagaradhyaksh.wardPerformance.avgResolutionTime')}</span>
                  <span>
                    {w.avgResolutionDays != null
                      ? t('nagaradhyaksh.wardPerformance.days', { count: w.avgResolutionDays })
                      : '—'}
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${w.resolutionRate}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
