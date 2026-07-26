import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { WARDS_BY_CITY, DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { STAFF_BY_CITY } from '../../graphql/queries/admin.queries';
import {
  CREATE_STAFF_USER,
  DELETE_STAFF_USER,
  SET_STAFF_ACTIVE,
  UPDATE_STAFF_USER,
} from '../../graphql/mutations/admin.mutations';
import type { DepartmentRef, Role, UserFields, WardRef } from '../../graphql/types';
import { useAuth } from '../auth/AuthContext';

const STAFF_ROLES: Role[] = ['NAGARSEVAK', 'NAGARADHYAKSH', 'OFFICER', 'DRIVER'];

export function StaffPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const citySlug = session!.citySlug;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [wardId, setWardId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const { data: staffData, loading } = useQuery<{ staffByCity: UserFields[] }>(STAFF_BY_CITY);
  const { data: wardsData } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, { variables: { citySlug } });
  const { data: deptData } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, {
    variables: { citySlug },
  });

  const [createStaffUser, { loading: creating, error }] = useMutation(CREATE_STAFF_USER, {
    refetchQueries: [{ query: STAFF_BY_CITY }],
  });
  const [updateStaffUser, { loading: updating, error: updateError }] = useMutation(UPDATE_STAFF_USER, {
    refetchQueries: [{ query: STAFF_BY_CITY }],
  });
  const [setStaffActive] = useMutation(SET_STAFF_ACTIVE, { refetchQueries: [{ query: STAFF_BY_CITY }] });
  const [deleteStaffUser, { error: deleteError }] = useMutation(DELETE_STAFF_USER, {
    refetchQueries: [{ query: STAFF_BY_CITY }],
  });

  async function handleDelete(u: UserFields) {
    if (window.confirm(t('admin.staff.confirmDelete'))) {
      await deleteStaffUser({ variables: { id: u.id } });
    }
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setMobile('');
    setRole('');
    setWardId('');
    setDepartmentId('');
  }

  function startEdit(u: UserFields) {
    setEditingId(u.id);
    setName(u.name);
    setMobile(u.mobile);
    setRole(u.role);
    setWardId(u.ward?.id ?? '');
    setDepartmentId(u.department?.id ?? '');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      await updateStaffUser({
        variables: {
          id: editingId,
          input: {
            name,
            mobile,
            wardId: role === 'NAGARSEVAK' ? wardId : undefined,
            departmentId: role === 'OFFICER' ? departmentId : undefined,
          },
        },
      });
    } else {
      await createStaffUser({
        variables: {
          input: {
            name,
            mobile,
            role,
            wardId: role === 'NAGARSEVAK' ? wardId : undefined,
            departmentId: role === 'OFFICER' ? departmentId : undefined,
          },
        },
      });
    }
    resetForm();
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  }

  return (
    <div>
      <h1>{t('admin.staff.title')}</h1>

      <div className="admin-panel">
        <h2>{editingId ? t('common.save') : t('admin.staff.addStaff')}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {t('auth.name')}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            {t('auth.mobile')}
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          </label>
          <label>
            {t('admin.staff.role')}
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} required disabled={!!editingId}>
              <option value="" disabled>
                {t('admin.staff.selectRole')}
              </option>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`role.${r}`)}
                </option>
              ))}
            </select>
          </label>
          {role === 'NAGARSEVAK' && (
            <label>
              {t('auth.ward')}
              <select value={wardId} onChange={(e) => setWardId(e.target.value)} required>
                <option value="" disabled>
                  {t('auth.selectWard')}
                </option>
                {wardsData?.wardsByCity.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </label>
          )}
          {role === 'OFFICER' && (
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
          )}
          <div className="action-row">
            <button type="submit" disabled={creating || updating}>
              {editingId ? t('common.save') : t('admin.staff.addStaff')}
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
        {successMsg && <p className="form-success">{t('admin.staff.created')}</p>}
      </div>

      <div className="admin-panel">
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : staffData?.staffByCity.length === 0 ? (
          <p>{t('admin.staff.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('auth.name')}</th>
                <th>{t('admin.staff.role')}</th>
                <th>{t('auth.mobile')}</th>
                <th>{t('auth.ward')}</th>
                <th>{t('citizen.department')}</th>
                <th>{t('admin.staff.status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staffData?.staffByCity.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{t(`role.${u.role}`)}</td>
                  <td>{u.mobile}</td>
                  <td>{u.ward?.name ?? '—'}</td>
                  <td>{u.department?.name ?? '—'}</td>
                  <td>{u.isActive ? t('admin.staff.active') : t('admin.staff.inactive')}</td>
                  <td className="action-row">
                    <button type="button" className="btn-secondary" onClick={() => startEdit(u)}>
                      {t('admin.emergencyContacts.edit')}
                    </button>
                    <button
                      type="button"
                      className={u.isActive ? 'btn-danger' : ''}
                      onClick={() => setStaffActive({ variables: { id: u.id, isActive: !u.isActive } })}
                    >
                      {u.isActive ? t('admin.staff.deactivate') : t('admin.staff.activate')}
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(u)}>
                      {t('admin.staff.delete')}
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
