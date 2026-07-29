import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { ALL_REQUESTS } from '../../graphql/queries/admin.queries';
import type { RequestPage, RequestStatus, RequestType } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';

const STATUS_PILLS: { label: string; value: RequestStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Registered', value: 'REGISTERED' },
  { label: 'Verified', value: 'VERIFIED' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Rejected', value: 'REJECTED' },
];
const TYPES: RequestType[] = ['COMPLAINT', 'APPOINTMENT'];

export function AllRequestsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, loading, error } = useQuery<{ allRequests: RequestPage }>(ALL_REQUESTS, {
    variables: {
      filter: { status: status || undefined, type: type || undefined },
      page,
      limit,
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.allRequests.total / limit)) : 1;

  return (
    <div>
      <h1>{t('admin.requests.allTitle')}</h1>

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
        <label style={{ marginLeft: 'auto' }}>
          {t('admin.requests.filterType')}
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('admin.requests.allTypes')}</option>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {ty}
              </option>
            ))}
          </select>
        </label>
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
                    <td>{r.__typename === 'Complaint' ? (r.category ?? r.title) : r.purpose}</td>
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
                      <Link to={`/${citySlug}/admin/requests/${r.id}`} target="_blank" rel="noopener noreferrer">{t('admin.requests.viewDetail')}</Link>
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
