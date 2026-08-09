import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { ALL_REQUESTS } from '../../graphql/queries/admin.queries';
import type { RequestPage, RequestStatus } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';

const STATUS_PILLS: { label: string; value: RequestStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Registered', value: 'REGISTERED' },
  { label: 'Verified', value: 'VERIFIED' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export function PendingRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [status, setStatus] = useState<RequestStatus | ''>('REGISTERED');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, loading, error, refetch } = useQuery<{ allRequests: RequestPage }>(ALL_REQUESTS, {
    variables: {
      filter: { type: 'COMPLAINT', status: status || undefined },
      page,
      limit,
    },
  });
  useRefetchOnFocus(refetch);

  const totalPages = data ? Math.max(1, Math.ceil(data.allRequests.total / limit)) : 1;

  return (
    <div>
      <h1>{t('admin.nav.requests')}</h1>

      <div className="filter-bar">
        {STATUS_PILLS.map((s) => (
          <button
            key={s.label}
            type="button"
            className={`filter-pill${status === s.value ? ' active' : ''}`}
            onClick={() => {
              setStatus(s.value);
              setPage(1);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && (
        <Card>
          <Skeleton variant="rows" count={6} />
        </Card>
      )}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && (
        <Card>
          {data?.allRequests.items.length === 0 ? (
            <EmptyState icon={ClipboardList} message={t('admin.requests.noResults')} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>{t('citizen.title')}</th>
                  <th>{t('admin.requests.citizen')}</th>
                  <th>{t('admin.requests.ward')}</th>
                  <th>Priority</th>
                  <th>{t('admin.requests.department')}</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data?.allRequests.items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.category ?? r.title}</td>
                    <td>{r.citizen.name}</td>
                    <td>{r.ward.name}</td>
                    <td>
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td>{r.department?.name ?? '—'}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <Link to={`/${citySlug}/admin/requests/${r.id}`}>{t('admin.requests.viewDetail')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {data && data.allRequests.total > limit && (
        <div className="action-row">
          <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('common.back')}
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
