import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Users as UsersIcon } from 'lucide-react';
import { USERS_BY_CITY } from '../../graphql/queries/admin.queries';
import { UPDATE_STAFF_USER, SET_STAFF_ACTIVE } from '../../graphql/mutations/admin.mutations';
import type { Role, UserFields } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const TABS: Role[] = ['CITIZEN', 'OFFICER', 'NAGARSEVAK', 'DRIVER'];

export function UsersPage() {
  const { t } = useTranslation();
  const [activeRole, setActiveRole] = useState<Role>('CITIZEN');
  const [editingUser, setEditingUser] = useState<UserFields | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  const { data, loading } = useQuery<{ usersByCity: UserFields[] }>(USERS_BY_CITY, {
    variables: { role: activeRole },
  });

  const [updateUser, { loading: saving, error: saveError }] = useMutation(UPDATE_STAFF_USER, {
    refetchQueries: [{ query: USERS_BY_CITY, variables: { role: activeRole } }],
  });
  const [setActive] = useMutation(SET_STAFF_ACTIVE, {
    refetchQueries: [{ query: USERS_BY_CITY, variables: { role: activeRole } }],
  });

  function startEdit(u: UserFields) {
    setEditingUser(u);
    setName(u.name);
    setMobile(u.mobile);
  }

  function cancelEdit() {
    setEditingUser(null);
    setName('');
    setMobile('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    await updateUser({ variables: { id: editingUser.id, input: { name, mobile } } });
    cancelEdit();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  }

  async function toggleActive(u: UserFields) {
    const confirmMsg = u.isActive ? t('admin.users.confirmDeactivate') : t('admin.users.confirmActivate');
    if (window.confirm(confirmMsg)) {
      await setActive({ variables: { id: u.id, isActive: !u.isActive } });
    }
  }

  const users = data?.usersByCity ?? [];

  return (
    <div>
      <h1>{t('admin.users.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('admin.users.subtitle')}</p>

      <div className="tab-bar">
        {TABS.map((role) => (
          <button
            key={role}
            type="button"
            className={role === activeRole ? 'active' : ''}
            onClick={() => {
              setActiveRole(role);
              cancelEdit();
            }}
          >
            {t(`admin.users.tabs.${role}`)}
          </button>
        ))}
      </div>

      {editingUser && (
        <Card title={t('admin.users.editUser')}>
          <form onSubmit={handleSubmit}>
            <Input label={t('auth.name')} value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label={t('auth.mobile')} value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            <div className="action-row">
              <Button type="submit" loading={saving}>
                {t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
          {saveError && <p className="form-error">{saveError.message}</p>}
        </Card>
      )}
      {savedMsg && <p className="form-success">{t('admin.users.saved')}</p>}

      <Card>
        {loading ? (
          <Skeleton variant="rows" count={4} />
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} message={t('admin.users.empty')} />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>{t('admin.users.name')}</th>
                <th>{t('admin.users.status')}</th>
                <th>{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const scope = u.ward?.name ? `Ward ${u.ward.code}` : u.department?.name;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>
                        {[scope, u.mobile].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td>
                      <Badge tone={u.isActive ? 'success' : 'neutral'}>
                        {u.isActive ? t('admin.users.active') : t('admin.users.inactive')}
                      </Badge>
                    </td>
                    <td className="action-row">
                      <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(u)}>
                        {t('admin.users.edit')}
                      </Button>
                      <Button
                        type="button"
                        variant={u.isActive ? 'danger' : 'success'}
                        size="sm"
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? t('admin.users.deactivate') : t('admin.users.activate')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
