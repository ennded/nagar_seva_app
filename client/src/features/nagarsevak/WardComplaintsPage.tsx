import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { WARD_REQUESTS } from '../../graphql/queries/monitor.queries';
import type { RequestSummary } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { shortRequestId } from '../../utils/requestId';
import { isComplaint } from './nagarsevakStats';

export function WardComplaintsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading, error } = useQuery<{ wardRequests: RequestSummary[] }>(WARD_REQUESTS);

  const complaints = (data?.wardRequests ?? [])
    .filter(isComplaint)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <h1>{t('monitor.nav.complaints')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('monitor.wardComplaintsSubtitle')}</p>

      {loading && (
        <Card>
          <Skeleton variant="rows" count={5} />
        </Card>
      )}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && (
        <Card>
          {complaints.length === 0 ? (
            <EmptyState icon={ClipboardList} message={t('monitor.empty')} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>{t('monitor.table.id')}</th>
                  <th>{t('citizen.category')}</th>
                  <th>{t('admin.requests.citizen')}</th>
                  <th>{t('monitor.table.priority')}</th>
                  <th>{t('admin.requests.department')}</th>
                  <th>{t('monitor.table.officer')}</th>
                  <th>{t('monitor.table.status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((r) => (
                  <tr key={r.id}>
                    <td>{shortRequestId(r.id)}</td>
                    <td>{t(`citizen.categories.${r.category}`, r.category ?? '')}</td>
                    <td>{r.citizen.name}</td>
                    <td>
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td>{r.department?.name ?? '—'}</td>
                    <td>{r.assignedOfficer?.name ?? t('monitor.table.unassigned')}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <Link to={`/${citySlug}/nagarsevak/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
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
