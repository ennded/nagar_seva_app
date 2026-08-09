import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FileText, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { WARD_ANNOUNCEMENTS } from '../../graphql/queries/admin.queries';
import { CREATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT } from '../../graphql/mutations/admin.mutations';
import type { Announcement } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

const NAGARSEVAK_ORANGE = '#D97706';

export function WardAnnouncementsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data, loading } = useQuery<{ wardAnnouncements: Announcement[] }>(WARD_ANNOUNCEMENTS);
  const [createAnnouncement, { loading: creating, error }] = useMutation(CREATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: WARD_ANNOUNCEMENTS }],
  });
  const [deleteAnnouncement] = useMutation(DELETE_ANNOUNCEMENT, { refetchQueries: [{ query: WARD_ANNOUNCEMENTS }] });

  function resetForm() {
    setTitle('');
    setBody('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createAnnouncement({ variables: { input: { title, body } } });
    resetForm();
  }

  const wardName = session?.user.ward?.name ?? '';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t('monitor.announcements.title')}</h1>
          <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>
            {t('monitor.announcements.subtitle', { ward: wardName })}
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: NAGARSEVAK_ORANGE }}
        >
          <Plus size={16} />
          {t('admin.announcements.create')}
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <label style={{ flexBasis: '100%' }}>
            {t('admin.announcements.titleField')}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('monitor.announcements.titlePlaceholder')}
              required
            />
          </label>
          <label style={{ flexBasis: '100%' }}>
            {t('admin.announcements.body')}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('monitor.announcements.bodyPlaceholder')}
              required
            />
          </label>
          {error && <p className="form-error">{error.message}</p>}
          <button type="submit" disabled={creating} style={{ width: '100%', background: NAGARSEVAK_ORANGE }}>
            {t('monitor.announcements.publish', { ward: wardName })}
          </button>
        </form>
      </Card>

      {loading ? (
        <Skeleton variant="rows" count={3} />
      ) : data?.wardAnnouncements.length === 0 ? (
        <EmptyState icon={FileText} message={t('admin.announcements.empty')} />
      ) : (
        <ul className="request-list">
          {data?.wardAnnouncements.map((a) => (
            <li key={a.id} className="request-list-item" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FCEEE1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} color={NAGARSEVAK_ORANGE} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong>{a.title}</strong>
                  <span className="request-meta">{new Date(a.createdAt).toLocaleDateString()}</span>
                  <p style={{ fontSize: 13.5, color: 'var(--color-text)', marginTop: 6 }}>{a.body}</p>
                </div>
              </div>
              <button type="button" className="btn-danger" onClick={() => deleteAnnouncement({ variables: { id: a.id } })}>
                {t('admin.emergencyContacts.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
