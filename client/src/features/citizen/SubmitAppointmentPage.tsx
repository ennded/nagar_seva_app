import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { OFFICERS_BY_DEPARTMENT } from '../../graphql/queries/admin.queries';
import { SUBMIT_APPOINTMENT } from '../../graphql/mutations/request.mutations';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import type { DepartmentRef, RequestUnion, UserFields } from '../../graphql/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SubmitAppointmentPage() {
  const { t } = useTranslation();
  const { citySlug = '' } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();

  const [departmentId, setDepartmentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');

  const { data: deptData } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, {
    variables: { citySlug },
  });
  const { data: officersData } = useQuery<{ officersByDepartment: UserFields[] }>(OFFICERS_BY_DEPARTMENT, {
    variables: { departmentId },
    skip: !departmentId,
  });
  const [submitAppointment, { loading, error }] = useMutation<{ submitAppointment: RequestUnion }>(
    SUBMIT_APPOINTMENT,
    { refetchQueries: [{ query: MY_REQUESTS }] },
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { data } = await submitAppointment({
      variables: { input: { departmentId, purpose, remarks: remarks || undefined } },
    });
    if (data) navigate(`/${citySlug}/citizen/requests/${data.submitAppointment.id}`);
  }

  return (
    <div className="request-form-page">
      <h1>{t('citizen.newAppointment')}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          {t('citizen.department')}
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
            <option value="" disabled>
              {t('citizen.selectDepartment')}
            </option>
            {deptData?.departmentsByCity.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        {departmentId && officersData && (
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            <strong>{t('citizen.officerAvailability')}:</strong>
            <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem' }}>
              {officersData.officersByDepartment.map((o) => (
                <li key={o.id}>
                  {o.name} —{' '}
                  {o.availability.length === 0
                    ? t('citizen.noAvailabilitySet')
                    : o.availability
                        .slice()
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((a) => `${DAY_NAMES[a.dayOfWeek]} ${a.startTime}-${a.endTime}`)
                        .join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        <label>
          {t('citizen.purpose')}
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
        </label>
        <label>
          {t('citizen.remarks')}
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </label>
        {error && <p className="form-error">{error.message}</p>}
        <button type="submit" disabled={loading}>
          {t('common.submit')}
        </button>
      </form>
    </div>
  );
}
