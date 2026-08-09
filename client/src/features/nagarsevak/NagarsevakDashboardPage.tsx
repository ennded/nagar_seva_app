import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Clock3, CheckCircle2, CalendarClock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { WARD_REQUESTS } from '../../graphql/queries/monitor.queries';
import type { RequestSummary } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { CATEGORY_ICON, type ComplaintCategory } from '../citizen/categoryIcons';
import { shortRequestId } from '../../utils/requestId';
import { isAppointmentToday, isComplaint, isOpenComplaint, isResolvedToday, isUpcomingThisWeek } from './nagarsevakStats';

const GREEN = '#1E8A5F';

export function NagarsevakDashboardPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { session } = useAuth();
  const { data, loading, error } = useQuery<{ wardRequests: RequestSummary[] }>(WARD_REQUESTS);

  const all = data?.wardRequests ?? [];
  const complaints = all.filter(isComplaint);
  const inProgress = complaints.filter((r) => r.status === 'IN_PROGRESS');
  const open = all.filter(isOpenComplaint);
  const resolvedToday = all.filter((r) => isResolvedToday(r));
  const appointmentsToday = all.filter((r) => isAppointmentToday(r));
  const upcomingThisWeek = all.filter((r) => isUpcomingThisWeek(r));

  const latestComplaints = [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const tiles = [
    {
      Icon: ClipboardList,
      value: complaints.length,
      label: t('monitor.dashboard.totalComplaints'),
      insight: t('monitor.dashboard.inProgressCount', { count: inProgress.length }),
    },
    {
      Icon: Clock3,
      value: open.length,
      label: t('monitor.dashboard.openComplaints'),
      insight: t('monitor.dashboard.awaitingAssignment'),
    },
    {
      Icon: CheckCircle2,
      value: resolvedToday.length,
      label: t('monitor.dashboard.resolvedToday'),
      insight: t('monitor.dashboard.onSchedule'),
    },
    {
      Icon: CalendarClock,
      value: appointmentsToday.length,
      label: t('monitor.dashboard.appointmentsToday'),
      insight: t('monitor.dashboard.upcomingThisWeek', { count: upcomingThisWeek.length }),
    },
  ];

  return (
    <div>
      <h1>{t('monitor.dashboard.title')}</h1>
      <p>{t('monitor.dashboard.subtitle', { ward: session?.user.ward?.name ?? '' })}</p>

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
                <div style={{ fontSize: 12, fontWeight: 700, color: GREEN, marginTop: 4 }}>{tile.insight}</div>
              </div>
            ))}
          </section>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1.5rem 0 0.75rem' }}>
            <h2 style={{ margin: 0 }}>{t('monitor.dashboard.latestComplaints')}</h2>
            <Link to={`/${citySlug}/nagarsevak/complaints`}>{t('officer.dashboard.viewAll')}</Link>
          </div>

          {latestComplaints.length === 0 ? (
            <EmptyState icon={ClipboardList} message={t('monitor.empty')} />
          ) : (
            <ul className="request-list">
              {latestComplaints.map((r) => {
                const CategoryIcon = CATEGORY_ICON[r.category as ComplaintCategory] ?? ClipboardList;
                return (
                  <li key={r.id} className="request-list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F1F4F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CategoryIcon size={20} color="#14181C" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong>
                          {t(`citizen.categories.${r.category}`, r.category ?? '')} · {shortRequestId(r.id)}
                        </strong>
                        <span className="request-meta">
                          {r.citizen.name} · {r.address}
                          {session?.user.ward?.name ? `, ${session.user.ward.name}` : ''}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
