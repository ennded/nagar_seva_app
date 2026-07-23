import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { CREATE_DEPARTMENT } from '../../graphql/mutations/admin.mutations';
import { DASHBOARD_STATS, STAFF_BY_CITY } from '../../graphql/queries/admin.queries';
import type { DashboardStats, DepartmentRef, UserFields } from '../../graphql/types';
import { useAuth } from '../auth/AuthContext';

export function DepartmentsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const citySlug = session!.citySlug;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const { data, loading } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, {
    variables: { citySlug },
  });
  const { data: staffData } = useQuery<{ staffByCity: UserFields[] }>(STAFF_BY_CITY, { variables: { role: 'OFFICER' } });
  const { data: statsData } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS);
  const [createDepartment, { loading: creating, error }] = useMutation(CREATE_DEPARTMENT, {
    refetchQueries: [{ query: DEPARTMENTS_BY_CITY, variables: { citySlug } }],
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createDepartment({ variables: { name, description: description || undefined } });
    setName('');
    setDescription('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  }

  return (
    <div>
      <h1>{t('admin.departments.title')}</h1>

      <div className="admin-panel">
        <h2>{t('admin.departments.addDepartment')}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {t('admin.departments.name')}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            {t('admin.departments.description')}
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button type="submit" disabled={creating}>
            {t('admin.departments.addDepartment')}
          </button>
        </form>
        {error && <p className="form-error">{error.message}</p>}
        {successMsg && <p className="form-success">{t('admin.departments.created')}</p>}
      </div>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : data?.departmentsByCity.length === 0 ? (
        <p>{t('admin.departments.empty')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {data?.departmentsByCity.map((d) => {
            const officerCount = staffData?.staffByCity.filter((o) => o.department?.id === d.id).length ?? 0;
            const assignedCount = statsData?.dashboardStats.byDepartment.find((bd) => bd.department.id === d.id)?.count ?? 0;
            return (
              <div key={d.id} className="admin-panel" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="stat-tile-icon" style={{ margin: 0 }}>
                    <Building2 size={21} color="#0B3D66" />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{d.name}</div>
                </div>
                {d.description && <p style={{ fontSize: 13.5, color: 'var(--color-muted)', marginTop: 0 }}>{d.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
                  <span style={{ color: 'var(--color-muted)' }}>Officers</span>
                  <span style={{ fontWeight: 700 }}>{officerCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                  <span style={{ color: 'var(--color-muted)' }}>Assigned Requests</span>
                  <span style={{ fontWeight: 700 }}>{assignedCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
