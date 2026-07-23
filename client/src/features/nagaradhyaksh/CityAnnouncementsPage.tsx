import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { ANNOUNCEMENTS_ADMIN } from '../../graphql/queries/admin.queries';
import { CREATE_ANNOUNCEMENT } from '../../graphql/mutations/admin.mutations';
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

export function CityAnnouncementsPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const { data, loading } = useQuery<{ announcementsAdmin: Announcement[] }>(ANNOUNCEMENTS_ADMIN);
  const [createAnnouncement, { loading: creating, error }] = useMutation(CREATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: ANNOUNCEMENTS_ADMIN }],
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createAnnouncement({ variables: { input: { title, body, category, isEmergency } } });
    setTitle('');
    setBody('');
    setIsEmergency(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  }

  return (
    <div>
      <h1>{t('admin.announcements.title')}</h1>
      <div className="info-banner">
        Notices you create here are saved as drafts — the Municipal Admin publishes them city-wide.
      </div>

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
          <label
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setIsEmergency((v) => !v)}
          >
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              style={{ width: 20, height: 20, minHeight: 'unset' }}
            />
            Mark as Emergency Broadcast
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
          <ul className="request-list">
            {data?.announcementsAdmin.map((a) => (
              <li key={a.id} className="request-list-item">
                <div>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {a.isEmergency && <AlertTriangle size={14} color="var(--color-danger)" />}
                    {a.title}
                  </strong>
                  <span className="request-meta">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <span>{a.status === 'published' ? t('admin.announcements.published') : t('admin.announcements.draft')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
