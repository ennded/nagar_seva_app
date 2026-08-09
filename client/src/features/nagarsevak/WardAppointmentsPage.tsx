import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { CalendarClock } from 'lucide-react';
import { WARD_REQUESTS } from '../../graphql/queries/monitor.queries';
import type { RequestSummary } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { isAppointment } from './nagarsevakStats';

export function WardAppointmentsPage() {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery<{ wardRequests: RequestSummary[] }>(WARD_REQUESTS);

  const appointments = (data?.wardRequests ?? [])
    .filter(isAppointment)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <h1>{t('monitor.nav.appointments')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('monitor.wardAppointmentsSubtitle')}</p>

      {loading && (
        <Card>
          <Skeleton variant="rows" count={5} />
        </Card>
      )}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && (
        <Card>
          {appointments.length === 0 ? (
            <EmptyState icon={CalendarClock} message={t('monitor.emptyAppointments')} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>{t('admin.requests.citizen')}</th>
                  <th>{t('citizen.purpose')}</th>
                  <th>{t('admin.requests.department')}</th>
                  <th>{t('monitor.table.date')}</th>
                  <th>{t('monitor.table.officer')}</th>
                  <th>{t('monitor.table.status')}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((r) => (
                  <tr key={r.id}>
                    <td>{r.citizen.name}</td>
                    <td>{r.purpose}</td>
                    <td>{r.department?.name ?? '—'}</td>
                    <td>
                      {r.confirmedDate
                        ? new Date(r.confirmedDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td>{r.assignedOfficer?.name ?? t('monitor.table.unassigned')}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
