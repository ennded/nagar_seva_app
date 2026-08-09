import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList, CheckCircle2, TrendingUp, Timer } from 'lucide-react';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/officer.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { CATEGORY_ICON, COMPLAINT_CATEGORIES, type ComplaintCategory } from '../citizen/categoryIcons';
import { isOfficerDone, wasResolvedOnTime } from './officerStats';

export function OfficerPerformancePage() {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS);

  const all = data?.myAssignedRequests ?? [];
  const resolved = all.filter(isOfficerDone);
  const resolutionRate = all.length > 0 ? Math.round((resolved.length / all.length) * 100) : 0;
  const onTimeCount = resolved.filter(wasResolvedOnTime).length;
  const onTimeRate = resolved.length > 0 ? Math.round((onTimeCount / resolved.length) * 100) : 0;

  const complaints = all.filter((r): r is Complaint => r.__typename === 'Complaint');
  const byCategory = COMPLAINT_CATEGORIES.map((category) => {
    const inCategory = complaints.filter((c) => c.category === category);
    const resolvedInCategory = inCategory.filter(isOfficerDone);
    return {
      category,
      total: inCategory.length,
      resolved: resolvedInCategory.length,
      rate: inCategory.length > 0 ? Math.round((resolvedInCategory.length / inCategory.length) * 100) : 0,
    };
  }).filter((row) => row.total > 0);

  const tiles = [
    { Icon: ClipboardList, value: all.length, label: t('officer.performance.totalAssigned') },
    { Icon: CheckCircle2, value: resolved.length, label: t('officer.performance.totalResolved') },
    { Icon: TrendingUp, value: `${resolutionRate}%`, label: t('officer.performance.resolutionRate') },
    { Icon: Timer, value: `${onTimeRate}%`, label: t('officer.performance.onTimeRate') },
  ];

  return (
    <div>
      <h1>{t('officer.performance.title')}</h1>
      <p>{t('officer.performance.subtitle')}</p>

      {loading && <Skeleton variant="rows" count={4} />}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && (
        <>
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

          <div className="admin-panel">
            <h2>{t('officer.performance.byCategory')}</h2>
            {byCategory.length === 0 ? (
              <p>{t('officer.empty')}</p>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('citizen.category')}</th>
                      <th>{t('officer.performance.totalAssigned')}</th>
                      <th>{t('officer.performance.totalResolved')}</th>
                      <th>{t('officer.performance.resolutionRate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCategory.map((row) => {
                      const CategoryIcon = CATEGORY_ICON[row.category as ComplaintCategory];
                      return (
                        <tr key={row.category}>
                          <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CategoryIcon size={16} color="#0B3D66" />
                            {t(`citizen.categories.${row.category}`, row.category)}
                          </td>
                          <td>{row.total}</td>
                          <td>{row.resolved}</td>
                          <td>{row.rate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
