import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { WARDS_BY_CITY } from '../../graphql/queries/public.queries';
import { CREATE_WARD, DELETE_WARD, UPDATE_WARD } from '../../graphql/mutations/admin.mutations';
import type { WardRef } from '../../graphql/types';
import { useAuth } from '../auth/AuthContext';

export function WardsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const citySlug = session!.citySlug;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const { data, loading } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, { variables: { citySlug } });
  const refetchOpts = { refetchQueries: [{ query: WARDS_BY_CITY, variables: { citySlug } }] };
  const [createWard, { loading: creating, error }] = useMutation(CREATE_WARD, refetchOpts);
  const [updateWard, { loading: updating, error: updateError }] = useMutation(UPDATE_WARD, refetchOpts);
  const [deleteWard, { error: deleteError }] = useMutation(DELETE_WARD, refetchOpts);

  function resetForm() {
    setEditingId(null);
    setName('');
    setCode('');
  }

  function startEdit(w: WardRef) {
    setEditingId(w.id);
    setName(w.name);
    setCode(w.code);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      await updateWard({ variables: { id: editingId, name, code } });
    } else {
      await createWard({ variables: { name, code } });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }
    resetForm();
  }

  async function handleDelete(id: string) {
    if (window.confirm(t('admin.wards.confirmDelete'))) {
      await deleteWard({ variables: { id } });
    }
  }

  return (
    <div>
      <h1>{t('admin.wards.title')}</h1>

      <div className="admin-panel">
        <h2>{editingId ? t('admin.wards.edit') : t('admin.wards.addWard')}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {t('admin.wards.name')}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            {t('admin.wards.code')}
            <input value={code} onChange={(e) => setCode(e.target.value)} required />
          </label>
          <div className="action-row">
            <button type="submit" disabled={creating || updating}>
              {editingId ? t('common.save') : t('admin.wards.addWard')}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>
        {(error || updateError || deleteError) && (
          <p className="form-error">{(error ?? updateError ?? deleteError)!.message}</p>
        )}
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.wardsByCity.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.code}</td>
                  <td>{w.nagarsevak?.name ?? t('admin.wards.none')}</td>
                  <td className="action-row">
                    <button type="button" className="btn-secondary" onClick={() => startEdit(w)}>
                      {t('admin.wards.edit')}
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(w.id)}>
                      {t('admin.wards.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
