import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { WARD_ANNOUNCEMENTS } from '../../graphql/queries/admin.queries';
import { CREATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT } from '../../graphql/mutations/admin.mutations';
import type { Announcement } from '../../graphql/types';

const CATEGORIES = [
  'GENERAL',
  'WATER_SUPPLY',
  'ROAD_CLOSURE',
  'EVENT',
  'TAX_REMINDER',
  'SCHEME',
  'DEVELOPMENT_PROJECT',
  'INFRASTRUCTURE',
];

export function WardAnnouncementsPage() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  const { data, loading } = useQuery<{ wardAnnouncements: Announcement[] }>(WARD_ANNOUNCEMENTS);
  const [createAnnouncement, { loading: creating, error }] = useMutation(CREATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: WARD_ANNOUNCEMENTS }],
  });
  const [deleteAnnouncement] = useMutation(DELETE_ANNOUNCEMENT, { refetchQueries: [{ query: WARD_ANNOUNCEMENTS }] });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createAnnouncement({ variables: { input: { title, body, category } } });
    setTitle('');
    setBody('');
    setShowForm(false);
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('admin.announcements.title')}</h1>
        <button type="button" onClick={() => setShowForm((s) => !s)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} />
          {t('admin.announcements.create')}
        </button>
      </div>

      {showForm && (
        <div className="admin-panel">
          <form onSubmit={handleSubmit}>
            <label>
              {t('admin.announcements.titleField')}
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              {t('admin.announcements.category')}
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ flexBasis: '100%' }}>
              {t('admin.announcements.body')}
              <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
            </label>
            <button type="submit" disabled={creating}>
              {t('admin.announcements.create')}
            </button>
          </form>
          {error && <p className="form-error">{error.message}</p>}
        </div>
      )}

      <div className="admin-panel">
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : data?.wardAnnouncements.length === 0 ? (
          <p>{t('admin.announcements.empty')}</p>
        ) : (
          <ul className="request-list">
            {data?.wardAnnouncements.map((a) => (
              <li key={a.id} className="request-list-item">
                <div>
                  <strong>{a.title}</strong>
                  <span className="request-meta">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <button type="button" className="btn-danger" onClick={() => deleteAnnouncement({ variables: { id: a.id } })}>
                  {t('admin.emergencyContacts.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
