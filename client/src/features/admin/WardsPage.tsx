import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { WARDS_BY_CITY } from '../../graphql/queries/public.queries';
import { CREATE_WARD } from '../../graphql/mutations/admin.mutations';
import type { WardRef } from '../../graphql/types';
import { useAuth } from '../auth/AuthContext';

export function WardsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const citySlug = session!.citySlug;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const { data, loading } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, { variables: { citySlug } });
  const [createWard, { loading: creating, error }] = useMutation(CREATE_WARD, {
    refetchQueries: [{ query: WARDS_BY_CITY, variables: { citySlug } }],
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createWard({ variables: { name, code } });
    setName('');
    setCode('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  }

  return (
    <div>
      <h1>{t('admin.wards.title')}</h1>

      <div className="admin-panel">
        <h2>{t('admin.wards.addWard')}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {t('admin.wards.name')}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            {t('admin.wards.code')}
            <input value={code} onChange={(e) => setCode(e.target.value)} required />
          </label>
          <button type="submit" disabled={creating}>
            {t('admin.wards.addWard')}
          </button>
        </form>
        {error && <p className="form-error">{error.message}</p>}
        {successMsg && <p className="form-success">{t('admin.wards.created')}</p>}
      </div>

      <div className="admin-panel">
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : data?.wardsByCity.length === 0 ? (
          <p>{t('admin.wards.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.wards.name')}</th>
                <th>{t('admin.wards.code')}</th>
                <th>{t('admin.wards.nagarsevak')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.wardsByCity.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.code}</td>
                  <td>{w.nagarsevak?.name ?? t('admin.wards.none')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
