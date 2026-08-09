import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { DEPARTMENT_PERFORMANCE } from '../../graphql/queries/admin.queries';
import { WARD_REQUESTS } from '../../graphql/queries/monitor.queries';
import type { DepartmentPerformance, RequestSummary } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { COMPLAINT_CATEGORIES } from '../citizen/categoryIcons';
import { isComplaint } from './nagarsevakStats';
import { loadAuthSession } from '../../apollo/authStorage';

const NAGARSEVAK_ORANGE = '#D97706';
const CORE_REST_URL = import.meta.env.VITE_CORE_REST_URL ?? 'http://localhost:4001';

type Format = 'pdf' | 'xlsx';

export function WardReportsPage() {
  const { t } = useTranslation();
  const { data: reqData, loading: reqLoading } = useQuery<{ wardRequests: RequestSummary[] }>(WARD_REQUESTS);
  const { data: perfData, loading: perfLoading } = useQuery<{ departmentPerformance: DepartmentPerformance[] }>(
    DEPARTMENT_PERFORMANCE,
  );
  const [pending, setPending] = useState<Format | null>(null);
  const [downloadFailed, setDownloadFailed] = useState(false);

  const complaints = (reqData?.wardRequests ?? []).filter(isComplaint);
  const byCategory = COMPLAINT_CATEGORIES.map((category) => ({
    category,
    count: complaints.filter((c) => c.category === category).length,
  })).filter((row) => row.count > 0);
  const maxCategoryCount = Math.max(1, ...byCategory.map((c) => c.count));

  const departmentPerformance = perfData?.departmentPerformance ?? [];

  async function download(format: Format) {
    setDownloadFailed(false);
    setPending(format);
    try {
      const token = loadAuthSession()?.token;
      const res = await fetch(`${CORE_REST_URL}/reports/department-performance/${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Report request failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ward-department-performance.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadFailed(true);
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <h1>{t('monitor.nav.reports')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('monitor.reportsSubtitle')}</p>

      <div className="responsive-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title={t('monitor.reports.byCategory')}>
          {reqLoading ? (
            <Skeleton variant="rows" count={4} />
          ) : byCategory.length === 0 ? (
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{t('monitor.empty')}</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', height: 180, overflowX: 'auto' }}>
              {byCategory.map((c) => (
                <div
                  key={c.category}
                  style={{ flex: '1 0 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{c.count}</span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 40,
                      borderRadius: '6px 6px 0 0',
                      background: NAGARSEVAK_ORANGE,
                      height: `${Math.max(6, (c.count / maxCategoryCount) * 100)}%`,
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textAlign: 'center' }}>
                    {t(`citizen.categories.${c.category}`, c.category)}
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

      {downloadFailed && <p className="form-error">{t('admin.reports.downloadFailed')}</p>}
      <div className="action-row">
        <button type="button" className="btn-secondary" disabled={pending === 'pdf'} onClick={() => download('pdf')}>
          {pending === 'pdf' ? t('admin.reports.generating') : t('monitor.reports.exportPdf')}
        </button>
        <button type="button" className="btn-secondary" disabled={pending === 'xlsx'} onClick={() => download('xlsx')}>
          {pending === 'xlsx' ? t('admin.reports.generating') : t('monitor.reports.exportExcel')}
        </button>
      </div>
    </div>
  );
}
