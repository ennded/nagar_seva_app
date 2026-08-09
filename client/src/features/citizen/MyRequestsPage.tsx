import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, ClipboardList } from 'lucide-react';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import type { Appointment, Complaint, RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { CATEGORY_ICON, type ComplaintCategory } from './categoryIcons';
import { formatComplaintId } from './complaintId';
import { TEXT, MUTED, BORDER, NAVY } from '../landing/palette';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';

type Tab = 'complaints' | 'appointments';

export function MyRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get('q') ?? '').trim().toLowerCase();
  const [tab, setTab] = useState<Tab>('complaints');
  const { data, loading, error, refetch } = useQuery<{ myRequests: RequestUnion[] }>(MY_REQUESTS);
  useRefetchOnFocus(refetch);

  const complaints = (data?.myRequests ?? []).filter((r): r is Complaint => r.__typename === 'Complaint');
  const appointments = (data?.myRequests ?? []).filter((r): r is Appointment => r.__typename === 'Appointment');

  const numbered = [...complaints]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((c, i) => ({ complaint: c, sequenceNumber: i + 1 }));

  const visibleComplaints = numbered
    .filter(({ complaint: c }) => !searchTerm || c.title.toLowerCase().includes(searchTerm))
    .sort((a, b) => new Date(b.complaint.createdAt).getTime() - new Date(a.complaint.createdAt).getTime());

  const visibleAppointments = appointments
    .filter((a) => !searchTerm || a.purpose.toLowerCase().includes(searchTerm))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const TABS: { key: Tab; label: string }[] = [
    { key: 'complaints', label: t('citizen.tabComplaints') },
    { key: 'appointments', label: t('citizen.tabAppointments') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 800, color: TEXT }}>
        {t('citizen.myRequests')}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              border: `1px solid ${tab === key ? NAVY : BORDER}`,
              borderRadius: 100,
              padding: '8px 18px',
              fontSize: 13.5,
              fontWeight: 700,
              color: tab === key ? '#FFFFFF' : TEXT,
              background: tab === key ? NAVY : '#FFFFFF',
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 'unset',
              boxShadow: 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <Skeleton variant="rows" count={3} />}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && tab === 'complaints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {visibleComplaints.length === 0 && <EmptyState icon={ClipboardList} message={t('citizen.noComplaints')} />}
          {visibleComplaints.map(({ complaint: c, sequenceNumber }) => {
            const CategoryIcon = CATEGORY_ICON[c.category as ComplaintCategory] ?? ClipboardList;
            const date = new Date(c.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
            return (
              <Link
                key={c.id}
                to={`/${citySlug}/citizen/requests/${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: '#FFFFFF',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: 18,
                  textDecoration: 'none',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F1F4F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CategoryIcon size={20} color={TEXT} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: TEXT }}>{t(`citizen.categories.${c.category}`, c.category)}</div>
                  <div style={{ fontSize: 12.5, color: MUTED, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatComplaintId(sequenceNumber)} · {c.address}, {c.ward.name} · {date}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !error && tab === 'appointments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {visibleAppointments.length === 0 && <EmptyState icon={CalendarPlus} message={t('citizen.noAppointments')} />}
          {visibleAppointments.map((a) => {
            const date = new Date(a.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
            const subtitle = a.confirmedDate
              ? `${a.department?.name ?? '—'} · ${new Date(a.confirmedDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}${a.confirmedTimeSlot ? ` · ${a.confirmedTimeSlot}` : ''}`
              : `${a.department?.name ?? '—'} · ${date}`;
            return (
              <Link
                key={a.id}
                to={`/${citySlug}/citizen/requests/${a.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: '#FFFFFF',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: 18,
                  textDecoration: 'none',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F1F4F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarPlus size={20} color={TEXT} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: TEXT }}>{a.purpose}</div>
                  <div style={{ fontSize: 12.5, color: MUTED, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {subtitle}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
