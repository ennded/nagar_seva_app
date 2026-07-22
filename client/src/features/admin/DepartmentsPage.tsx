import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { CREATE_DEPARTMENT } from '../../graphql/mutations/admin.mutations';
import type { DepartmentRef } from '../../graphql/types';
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

      <div className="admin-panel">
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : data?.departmentsByCity.length === 0 ? (
          <p>{t('admin.departments.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.departments.name')}</th>
                <th>{t('admin.departments.description')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.departmentsByCity.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
