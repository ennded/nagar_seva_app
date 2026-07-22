import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { REQUEST_DETAIL } from '../../graphql/queries/request.queries';
import { DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { OFFICERS_BY_DEPARTMENT } from '../../graphql/queries/admin.queries';
import { ASSIGN_REQUEST, REVIEW_AND_CLOSE, VERIFY_REQUEST } from '../../graphql/mutations/admin.mutations';
import type { DepartmentRef, RequestUnion, UserFields } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../auth/AuthContext';

export function AdminRequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const citySlug = session!.citySlug;

  const { data, loading, error, refetch } = useQuery<{ request: RequestUnion | null }>(REQUEST_DETAIL, {
    variables: { id },
  });

  const [note, setNote] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [officerId, setOfficerId] = useState('');

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

  if (loading) return <p>{t('common.loading')}</p>;
  if (error) return <p className="form-error">{error.message}</p>;
  if (!data?.request) return <p>Not found.</p>;

  const r = data.request;

  async function handleVerify(approve: boolean) {
    await verifyRequest({ variables: { id, approve, note: note || undefined } });
    setNote('');
    refetch();
  }

  async function handleAssign() {
    await assignRequest({ variables: { id, departmentId, officerId } });
    setDepartmentId('');
    setOfficerId('');
    refetch();
  }

  async function handleClose() {
    await reviewAndClose({ variables: { id, note: note || undefined } });
    setNote('');
    refetch();
  }

  return (
    <div>
      <div className="page-header">
        <h1>{r.__typename === 'Complaint' ? r.title : r.purpose}</h1>
        <StatusBadge status={r.status} />
      </div>

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
            {r.photos.length > 0 && (
              <div className="photo-preview-list">
                {r.photos.map((p) => (
                  <img key={p.url} src={p.url} alt="" />
                ))}
              </div>
            )}
            {r.resolutionRemarks && (
              <p>
                <strong>{t('citizen.resolutionRemarks')}:</strong> {r.resolutionRemarks}
              </p>
            )}
            {r.resolutionProof.length > 0 && (
              <div className="photo-preview-list">
                {r.resolutionProof.map((p) => (
                  <img key={p.url} src={p.url} alt="" />
                ))}
              </div>
            )}
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

      {r.status === 'REGISTERED' && (
        <div className="admin-panel">
          <h2>{t('admin.requests.approve')}</h2>
          <label>
            {t('admin.requests.note')}
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="action-row">
            <button type="button" onClick={() => handleVerify(true)} disabled={verifying}>
              {t('admin.requests.approve')}
            </button>
            <button type="button" className="btn-danger" onClick={() => handleVerify(false)} disabled={verifying}>
              {t('admin.requests.reject')}
            </button>
          </div>
        </div>
      )}

      {r.status === 'VERIFIED' && (
        <div className="admin-panel">
          <h2>{t('admin.requests.assign')}</h2>
          <label>
            {t('admin.requests.selectDepartment')}
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setOfficerId('');
              }}
            >
              <option value="" disabled>
                {t('admin.requests.selectDepartment')}
              </option>
              {deptData?.departmentsByCity.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('admin.requests.selectOfficer')}
            <select value={officerId} onChange={(e) => setOfficerId(e.target.value)} disabled={!departmentId}>
              <option value="" disabled>
                {t('admin.requests.selectOfficer')}
              </option>
              {officersData?.officersByDepartment.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <div className="action-row">
            <button type="button" onClick={handleAssign} disabled={assigning || !departmentId || !officerId}>
              {t('admin.requests.assign')}
            </button>
          </div>
        </div>
      )}

      {(r.status === 'COMPLETED' || r.status === 'SCHEDULED') && (
        <div className="admin-panel">
          <h2>{t('admin.requests.reviewClose')}</h2>
          <label>
            {t('admin.requests.note')}
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="action-row">
            <button type="button" onClick={handleClose} disabled={closing}>
              {t('admin.requests.reviewClose')}
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
  );
}
