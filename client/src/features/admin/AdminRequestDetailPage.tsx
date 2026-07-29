import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { REQUEST_DETAIL } from '../../graphql/queries/request.queries';
import { DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { OFFICERS_BY_DEPARTMENT } from '../../graphql/queries/admin.queries';
import {
  ASSIGN_REQUEST,
  REVIEW_AND_CLOSE,
  SET_REQUEST_PRIORITY,
  VERIFY_REQUEST,
} from '../../graphql/mutations/admin.mutations';
import type { DepartmentRef, RequestPriority, RequestUnion, UserFields } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { FilePreview } from '../../components/FilePreview';
import { useAuth } from '../auth/AuthContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

const PRIORITIES: RequestPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

export function AdminRequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const citySlug = session!.citySlug;

  const { data, loading, error, refetch } = useQuery<{ request: RequestUnion | null }>(REQUEST_DETAIL, {
    variables: { id },
  });

  const [note, setNote] = useState('');
  const [assignPanel, setAssignPanel] = useState<'department' | 'officer' | null>(null);
  const [departmentId, setDepartmentId] = useState('');

  const { data: deptData } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, {
    variables: { citySlug },
  });
  const { data: officersData } = useQuery<{ officersByDepartment: UserFields[] }>(OFFICERS_BY_DEPARTMENT, {
    variables: { departmentId },
    skip: !departmentId,
  });

  const [verifyRequest, { loading: verifying }] = useMutation(VERIFY_REQUEST);
  const [assignRequest, { loading: assigning }] = useMutation(ASSIGN_REQUEST);
  const [reviewAndClose, { loading: closing }] = useMutation(REVIEW_AND_CLOSE);
  const [setRequestPriority] = useMutation(SET_REQUEST_PRIORITY);

  if (loading) return <Skeleton variant="rows" count={5} />;
  if (error) return <ErrorState message={error.message} />;
  if (!data?.request) return <EmptyState message="Not found." />;

  const r = data.request;

  async function handleVerify(approve: boolean) {
    await verifyRequest({ variables: { id, approve, note: note || undefined } });
    setNote('');
    refetch();
  }

  async function handleAssignOfficer(officerId: string) {
    await assignRequest({ variables: { id, departmentId, officerId } });
    setAssignPanel(null);
    setDepartmentId('');
    refetch();
  }

  async function handleClose() {
    await reviewAndClose({ variables: { id, note: note || undefined } });
    setNote('');
    refetch();
  }

  async function handlePriority(priority: RequestPriority) {
    await setRequestPriority({ variables: { id, priority } });
    refetch();
  }

  return (
    <div>
      <div className="page-header">
        <h1>{r.__typename === 'Complaint' ? r.title : r.purpose}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={r.status} />
          <PriorityBadge priority={r.priority} />
        </div>
      </div>

      <div className="responsive-grid-2" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="admin-panel">
            <p>
              <strong>{t('admin.requests.citizen')}:</strong> {r.citizen.name} ({r.citizen.mobile})
            </p>
            <p>
              <strong>{t('admin.requests.ward')}:</strong> {r.ward.name}
            </p>
            {r.__typename === 'Complaint' ? (
              <>
                <p>
                  <strong>{t('citizen.category')}:</strong> {r.category}
                </p>
                <p>
                  <strong>{t('citizen.description')}:</strong> {r.description}
                </p>
                <p>
                  <strong>{t('citizen.address')}:</strong> {r.address}
                </p>
              </>
            ) : (
              <>
                {r.department && (
                  <p>
                    <strong>{t('citizen.department')}:</strong> {r.department.name}
                  </p>
                )}
                {r.remarks && (
                  <p>
                    <strong>{t('citizen.remarks')}:</strong> {r.remarks}
                  </p>
                )}
                {r.confirmedDate && (
                  <p>
                    <strong>Confirmed:</strong> {new Date(r.confirmedDate).toLocaleDateString()} ({r.confirmedTimeSlot})
                  </p>
                )}
              </>
            )}
          </div>

          {r.__typename === 'Complaint' && r.photos.length > 0 && (
            <div className="admin-panel">
              <h2>{t('citizen.photos')}</h2>
              <div className="photo-preview-list">
                {r.photos.map((p) => (
                  <FilePreview key={p.url} url={p.url} />
                ))}
              </div>
            </div>
          )}

          {r.__typename === 'Complaint' && (r.resolutionRemarks || r.resolutionProof.length > 0) && (
            <div className="admin-panel">
              {r.resolutionRemarks && (
                <p>
                  <strong>{t('citizen.resolutionRemarks')}:</strong> {r.resolutionRemarks}
                </p>
              )}
              {r.resolutionProof.length > 0 && (
                <div className="photo-preview-list">
                  {r.resolutionProof.map((p) => (
                    <FilePreview key={p.url} url={p.url} />
                  ))}
                </div>
              )}
            </div>
          )}

          {r.status === 'REGISTERED' && (
            <div className="admin-panel">
              <h2>{t('admin.requests.approve')}</h2>
              <label>
                {t('admin.requests.note')}
                <textarea value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
              <div className="action-row">
                <button type="button" className="btn-success" onClick={() => handleVerify(true)} disabled={verifying}>
                  {t('admin.requests.approve')}
                </button>
                <button type="button" className="btn-danger" onClick={() => handleVerify(false)} disabled={verifying}>
                  {t('admin.requests.reject')}
                </button>
              </div>
            </div>
          )}

          <div className="admin-panel">
            <h3>{t('citizen.statusHistory')}</h3>
            <ul className="status-history">
              {r.statusHistory.map((event, i) => (
                <li key={i}>
                  <StatusBadge status={event.status} /> — {new Date(event.changedAt).toLocaleString()}
                  {event.changedBy && ` (${event.changedBy.name})`}
                  {event.note && <p>{event.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {r.status === 'VERIFIED' && (
            <div className="admin-panel">
              <h2>{t('admin.requests.assign')}</h2>
              <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>
                {r.department?.name ?? t('admin.requests.selectDepartment')} · {r.assignedOfficer?.name ?? '—'}
              </p>
              <div className="action-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAssignPanel(assignPanel === 'department' ? null : 'department')}
                >
                  {t('admin.requests.selectDepartment')}
                </button>
              </div>
              {assignPanel === 'department' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {deptData?.departmentsByCity.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setDepartmentId(d.id);
                        setAssignPanel('officer');
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: 13.5,
                        fontWeight: 700,
                      }}
                    >
                      {d.name}
                    </div>
                  ))}
                </div>
              )}
              {assignPanel === 'officer' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {officersData?.officersByDepartment.length === 0 && (
                    <p style={{ fontSize: 13.5, color: 'var(--color-muted)' }}>No officers in this department.</p>
                  )}
                  {officersData?.officersByDepartment.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => handleAssignOfficer(o.id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        cursor: assigning ? 'not-allowed' : 'pointer',
                        fontSize: 13.5,
                        fontWeight: 700,
                      }}
                    >
                      {o.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="admin-panel">
            <h2>Priority</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={r.priority === p ? '' : 'btn-secondary'}
                  style={{ flex: 1, fontSize: 13.5 }}
                  onClick={() => handlePriority(p)}
                >
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {(r.status === 'COMPLETED' || r.status === 'SCHEDULED') && (
            <div className="admin-panel">
              <h2>{t('admin.requests.reviewClose')}</h2>
              <label>
                {t('admin.requests.note')}
                <textarea value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
              <div className="action-row">
                <button type="button" className="btn-success" onClick={handleClose} disabled={closing}>
                  {t('admin.requests.reviewClose')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
