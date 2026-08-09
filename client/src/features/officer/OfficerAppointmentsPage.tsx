import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, Clock, CheckCircle2 } from 'lucide-react';
import { MY_ASSIGNED_REQUESTS } from '../../graphql/queries/officer.queries';
import type { Appointment, RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { shortRequestId } from '../../utils/requestId';

const ACTIVE_STATUSES = new Set(['ASSIGNED']);

export function OfficerAppointmentsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const { data, loading, error } = useQuery<{ myAssignedRequests: RequestUnion[] }>(MY_ASSIGNED_REQUESTS);

  const all = (data?.myAssignedRequests ?? []).filter((r): r is Appointment => r.__typename === 'Appointment');
  const items = all.filter((r) => (tab === 'active' ? ACTIVE_STATUSES.has(r.status) : !ACTIVE_STATUSES.has(r.status)));

  const tiles = [
    { Icon: CalendarPlus, value: all.length, label: t('officer.nav.appointments') },
    { Icon: Clock, value: all.filter((r) => r.status === 'ASSIGNED').length, label: t('officer.awaitingSchedule') },
    { Icon: CheckCircle2, value: all.filter((r) => r.status === 'SCHEDULED' || r.status === 'CLOSED').length, label: t('officer.scheduled') },
  ];

  return (
    <div>
      <h1>{t('officer.nav.appointments')}</h1>

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

      <div className="tab-bar">
        <button type="button" className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>
          {t('officer.active')}
        </button>
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          {t('officer.history')}
        </button>
      </div>

      {loading && <Skeleton variant="rows" count={4} />}
      {error && <ErrorState message={error.message} />}

      {!loading &&
        !error &&
        (items.length === 0 ? (
          <EmptyState icon={CalendarPlus} message={t('officer.emptyAppointments')} />
        ) : (
          <ul className="request-list">
            {items.map((r) => (
              <li key={r.id} className="request-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F1F4F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CalendarPlus size={20} color="#14181C" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <strong>
                      {r.purpose} · {shortRequestId(r.id)}
                    </strong>
                    <span className="request-meta">
                      {r.citizen.name} · {r.department?.name ?? '—'}, {r.ward.name}
                      {r.confirmedDate && ` · ${new Date(r.confirmedDate).toLocaleDateString()}${r.confirmedTimeSlot ? ` · ${r.confirmedTimeSlot}` : ''}`}
                    </span>
                  </div>
                </div>
                <PriorityBadge priority={r.priority} />
                <StatusBadge status={r.status} />
                <Link to={`/${citySlug}/officer/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
