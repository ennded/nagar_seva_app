import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ANNOUNCEMENTS_ADMIN } from '../../graphql/queries/admin.queries';
import { CREATE_ANNOUNCEMENT, PUBLISH_ANNOUNCEMENT } from '../../graphql/mutations/admin.mutations';
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

export function AnnouncementsPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [successMsg, setSuccessMsg] = useState(false);

  const { data, loading } = useQuery<{ announcementsAdmin: Announcement[] }>(ANNOUNCEMENTS_ADMIN);
  const [createAnnouncement, { loading: creating, error }] = useMutation(CREATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: ANNOUNCEMENTS_ADMIN }],
  });
  const [publishAnnouncement, { loading: publishing }] = useMutation(PUBLISH_ANNOUNCEMENT, {
    refetchQueries: [{ query: ANNOUNCEMENTS_ADMIN }],
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createAnnouncement({ variables: { input: { title, body, category } } });
    setTitle('');
    setBody('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  }

  return (
    <div>
      <h1>{t('admin.announcements.title')}</h1>

      <div className="admin-panel">
        <h2>{t('admin.announcements.create')}</h2>
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
        {successMsg && <p className="form-success">{t('admin.announcements.created')}</p>}
      </div>

      <div className="admin-panel">
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : data?.announcementsAdmin.length === 0 ? (
          <p>{t('admin.announcements.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.announcements.titleField')}</th>
                <th>{t('admin.announcements.category')}</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.announcementsAdmin.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.category}</td>
                  <td>
                    {a.status === 'published' ? t('admin.announcements.published') : t('admin.announcements.draft')}
                  </td>
                  <td>
                    {a.status !== 'published' && (
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={publishing}
                        onClick={() => publishAnnouncement({ variables: { id: a.id } })}
                      >
                        {t('admin.announcements.publish')}
                      </button>
                    )}
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
