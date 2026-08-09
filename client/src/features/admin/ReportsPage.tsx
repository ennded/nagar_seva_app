import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Users, MapPin, Clock, Calendar, UserCheck } from 'lucide-react';
import { loadAuthSession } from '../../apollo/authStorage';

const CORE_REST_URL = import.meta.env.VITE_CORE_REST_URL ?? 'http://localhost:4001';

const REPORTS = [
  { type: 'monthly-complaints', icon: FileText, i18nKey: 'monthlyComplaints' },
  { type: 'department-performance', icon: Users, i18nKey: 'departmentPerformance' },
  { type: 'ward-performance', icon: MapPin, i18nKey: 'wardPerformance' },
  { type: 'resolution-time', icon: Clock, i18nKey: 'resolutionTime' },
  { type: 'appointment-statistics', icon: Calendar, i18nKey: 'appointmentStatistics' },
  { type: 'officer-performance', icon: UserCheck, i18nKey: 'officerPerformance' },
] as const;

type Format = 'pdf' | 'xlsx';

export function ReportsPage() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  async function download(type: string, format: Format) {
    const key = `${type}-${format}`;
    setFailedKey(null);
    setPending(key);
    try {
      const token = loadAuthSession()?.token;
      const res = await fetch(`${CORE_REST_URL}/reports/${type}/${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Report request failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setFailedKey(key);
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <h1>{t('admin.reports.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('admin.reports.subtitle')}</p>

      <div className="report-grid">
        {REPORTS.map(({ type, icon: Icon, i18nKey }) => (
          <div key={type} className="report-card">
            <div className="report-card-icon">
              <Icon size={20} color="var(--color-primary)" />
            </div>
            <h3>{t(`admin.reports.${i18nKey}.title`)}</h3>
            <p>{t(`admin.reports.${i18nKey}.desc`)}</p>
            {failedKey?.startsWith(type) && <p className="form-error">{t('admin.reports.downloadFailed')}</p>}
            <div className="action-row">
              <button
                type="button"
                className="btn-secondary"
                disabled={pending === `${type}-pdf`}
                onClick={() => download(type, 'pdf')}
              >
                {pending === `${type}-pdf` ? t('admin.reports.generating') : t('admin.reports.pdf')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={pending === `${type}-xlsx`}
                onClick={() => download(type, 'xlsx')}
              >
                {pending === `${type}-xlsx` ? t('admin.reports.generating') : t('admin.reports.excel')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
