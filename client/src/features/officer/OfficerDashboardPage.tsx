import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Clock3, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/officer.queries';
import type { Complaint, RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { CATEGORY_ICON, type ComplaintCategory } from '../citizen/categoryIcons';
import { shortRequestId } from '../../utils/requestId';
import { assignedAt, isActive, isOfficerDone, isOverdue, isResolvedWithinDays, wasResolvedOnTime } from './officerStats';

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const GREEN = '#1E8A5F';
const ORANGE = '#D97706';
const RED = '#DC2626';

export function OfficerDashboardPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { session } = useAuth();
  const { data, loading, error } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS);

  const all = data?.myAssignedRequests ?? [];
  const active = all.filter(isActive);
  const highPriorityActive = active.filter((r) => r.priority === 'HIGH');
  const pendingAction = all.filter((r) => r.status === 'ASSIGNED');
  const resolvedThisWeek = all.filter((r) => isOfficerDone(r) && isResolvedWithinDays(r, 7));
  const onTimeCount = resolvedThisWeek.filter(wasResolvedOnTime).length;
  const onTimeRate = resolvedThisWeek.length > 0 ? Math.round((onTimeCount / resolvedThisWeek.length) * 100) : 100;
  const overdue = active.filter((r) => isOverdue(r));

  const needsAction = active
    .filter((r): r is Complaint => r.__typename === 'Complaint')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || assignedAt(a).getTime() - assignedAt(b).getTime())
    .slice(0, 5);

  const tiles = [
    {
      Icon: ClipboardList,
      value: active.length,
      label: t('officer.dashboard.assignedToMe'),
      insight: highPriorityActive.length > 0 ? t('officer.dashboard.highPriorityCount', { count: highPriorityActive.length }) : t('officer.dashboard.noHighPriority'),
      insightColor: highPriorityActive.length > 0 ? ORANGE : GREEN,
    },
    {
      Icon: Clock3,
      value: pendingAction.length,
      label: t('officer.dashboard.pendingAction'),
      insight: t('officer.dashboard.actWithin48h'),
      insightColor: ORANGE,
    },
    {
      Icon: CheckCircle2,
      value: resolvedThisWeek.length,
      label: t('officer.dashboard.resolvedThisWeek'),
      insight: t('officer.dashboard.onTimeRate', { rate: onTimeRate }),
      insightColor: GREEN,
    },
    {
      Icon: AlertTriangle,
      value: overdue.length,
      label: t('officer.dashboard.overdue'),
      insight: overdue.length > 0 ? t('officer.dashboard.needAttention', { count: overdue.length }) : t('officer.dashboard.allOnSchedule'),
      insightColor: overdue.length > 0 ? RED : GREEN,
    },
  ];

  return (
    <div>
      <h1>{t('officer.dashboard.title')}</h1>
      <p>
        {session?.user.department?.name
          ? t('officer.dashboard.subtitleWithDept', { department: session.user.department.name })
          : t('officer.dashboard.subtitle')}
      </p>

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
                <div style={{ fontSize: 12, fontWeight: 700, color: tile.insightColor, marginTop: 4 }}>{tile.insight}</div>
              </div>
            ))}
          </section>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1.5rem 0 0.75rem' }}>
            <h2 style={{ margin: 0 }}>{t('officer.dashboard.needsAction')}</h2>
            <Link to={`/${citySlug}/officer/complaints`}>{t('officer.dashboard.viewAll')}</Link>
          </div>

          {needsAction.length === 0 ? (
            <EmptyState icon={ClipboardList} message={t('officer.dashboard.empty')} />
          ) : (
            <ul className="request-list">
              {needsAction.map((r) => {
                const CategoryIcon = CATEGORY_ICON[r.category as ComplaintCategory] ?? ClipboardList;
                return (
                  <li key={r.id} className="request-list-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F1F4F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CategoryIcon size={20} color="#14181C" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong>
                          {t(`citizen.categories.${r.category}`, r.category)} · {shortRequestId(r.id)}
                        </strong>
                        <span className="request-meta">
                          {r.citizen.name} · {r.address}, {r.ward.name}
                        </span>
                      </div>
                    </div>
                    <PriorityBadge priority={r.priority} />
                    <StatusBadge status={r.status} />
                    <Link to={`/${citySlug}/officer/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
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
