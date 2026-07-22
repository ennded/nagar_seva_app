import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { EMERGENCY_CONTACTS } from '../../graphql/queries/public.queries';
import {
  CREATE_EMERGENCY_CONTACT,
  DELETE_EMERGENCY_CONTACT,
  UPDATE_EMERGENCY_CONTACT,
} from '../../graphql/mutations/admin.mutations';
import type { EmergencyContact } from '../../graphql/types';
import { useAuth } from '../auth/AuthContext';

const CATEGORIES = ['POLICE', 'FIRE', 'AMBULANCE', 'MUNICIPALITY', 'WATER', 'ELECTRICITY'];

export function EmergencyContactsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const citySlug = session!.citySlug;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [order, setOrder] = useState(0);

  const { data, loading } = useQuery<{ emergencyContacts: EmergencyContact[] }>(EMERGENCY_CONTACTS, {
    variables: { citySlug },
  });
  const refetchOpts = { refetchQueries: [{ query: EMERGENCY_CONTACTS, variables: { citySlug } }] };
  const [createContact, { loading: creating, error }] = useMutation(CREATE_EMERGENCY_CONTACT, refetchOpts);
  const [updateContact, { loading: updating }] = useMutation(UPDATE_EMERGENCY_CONTACT, refetchOpts);
  const [deleteContact] = useMutation(DELETE_EMERGENCY_CONTACT, refetchOpts);

  function resetForm() {
    setEditingId(null);
    setName('');
    setCategory(CATEGORIES[0]);
    setPhoneNumber('');
    setOrder(0);
  }

  function startEdit(c: EmergencyContact) {
    setEditingId(c.id);
    setName(c.name);
    setCategory(c.category.toUpperCase());
    setPhoneNumber(c.phoneNumber);
    setOrder(c.order);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = { name, category, phoneNumber, order };
    if (editingId) {
      await updateContact({ variables: { id: editingId, input } });
    } else {
      await createContact({ variables: { input } });
    }
    resetForm();
  }

  async function handleDelete(id: string) {
    if (window.confirm(t('admin.emergencyContacts.confirmDelete'))) {
      await deleteContact({ variables: { id } });
    }
  }

  return (
    <div>
      <h1>{t('admin.emergencyContacts.title')}</h1>

      <div className="admin-panel">
        <h2>{editingId ? t('admin.emergencyContacts.edit') : t('admin.emergencyContacts.add')}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {t('admin.emergencyContacts.name')}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            {t('admin.emergencyContacts.category')}
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('admin.emergencyContacts.phoneNumber')}
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          </label>
          <label>
            {t('admin.emergencyContacts.order')}
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              style={{ maxWidth: 100 }}
            />
          </label>
          <div className="action-row">
            <button type="submit" disabled={creating || updating}>
              {editingId ? t('common.save') : t('admin.emergencyContacts.add')}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>
        {error && <p className="form-error">{error.message}</p>}
      </div>

      <div className="admin-panel">
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : data?.emergencyContacts.length === 0 ? (
          <p>{t('admin.emergencyContacts.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.emergencyContacts.name')}</th>
                <th>{t('admin.emergencyContacts.category')}</th>
                <th>{t('admin.emergencyContacts.phoneNumber')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.emergencyContacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.category}</td>
                  <td>{c.phoneNumber}</td>
                  <td className="action-row">
                    <button type="button" className="btn-secondary" onClick={() => startEdit(c)}>
                      {t('admin.emergencyContacts.edit')}
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(c.id)}>
                      {t('admin.emergencyContacts.delete')}
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
