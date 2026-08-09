import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_STATS } from '../../graphql/queries/admin.queries';
import type { DashboardStats } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: 'var(--color-danger)',
  MEDIUM: 'var(--color-warning)',
  LOW: 'var(--color-success)',
};

function BarChart({
  data,
  color,
  emptyMessage,
}: {
  data: { label: string; count: number }[];
  color: string | ((label: string) => string);
  emptyMessage: string;
}) {
  if (data.length === 0) {
    return <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{emptyMessage}</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', height: 180, overflowX: 'auto' }}>
      {data.map((d) => (
        <div
          key={d.label}
          style={{
            flex: '1 0 50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            height: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{d.count}</span>
          <div
            style={{
              width: '100%',
              maxWidth: 32,
              borderRadius: '6px 6px 0 0',
              background: typeof color === 'function' ? color(d.label) : color,
              height: `${Math.max(6, (d.count / max) * 100)}%`,
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textAlign: 'center' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ComplaintAnalyticsPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS);
  const stats = data?.dashboardStats;

  const byCategory = (stats?.byCategory ?? []).map((c) => ({ label: c.category, count: c.count }));
  const byWard = (stats?.byWard ?? []).map((w) => ({ label: w.ward.name, count: w.count }));
  const byPriority = (stats?.byPriority ?? []).map((p) => ({ label: p.priority, count: p.count }));

  return (
    <div>
      <h1>{t('nagaradhyaksh.complaintAnalytics.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('nagaradhyaksh.complaintAnalytics.subtitle')}</p>

      <div className="responsive-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title={t('nagaradhyaksh.complaintAnalytics.byCategory')}>
          {loading ? (
            <Skeleton variant="rows" count={4} />
          ) : (
            <BarChart data={byCategory} color="var(--color-danger)" emptyMessage={t('nagaradhyaksh.complaintAnalytics.noData')} />
          )}
        </Card>

        <Card title={t('nagaradhyaksh.complaintAnalytics.byWard')}>
          {loading ? (
            <Skeleton variant="rows" count={4} />
          ) : (
            <BarChart data={byWard} color="var(--color-primary)" emptyMessage={t('nagaradhyaksh.complaintAnalytics.noData')} />
          )}
        </Card>
      </div>

      <Card title={t('nagaradhyaksh.complaintAnalytics.byPriority')}>
        {loading ? (
          <Skeleton variant="rows" count={3} />
        ) : (
          <BarChart
            data={byPriority}
            color={(label) => PRIORITY_COLOR[label] ?? 'var(--color-primary)'}
            emptyMessage={t('nagaradhyaksh.complaintAnalytics.noData')}
          />
        )}
      </Card>
    </div>
  );
}
