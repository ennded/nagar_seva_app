import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, FileText, Plus } from 'lucide-react';
import { ANNOUNCEMENTS_ADMIN } from '../../graphql/queries/admin.queries';
import { CREATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT } from '../../graphql/mutations/admin.mutations';
import type { Announcement } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

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
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const { data, loading } = useQuery<{ announcementsAdmin: Announcement[] }>(ANNOUNCEMENTS_ADMIN);
  const [createAnnouncement, { loading: creating, error }] = useMutation(CREATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: ANNOUNCEMENTS_ADMIN }],
  });
  const [deleteAnnouncement] = useMutation(DELETE_ANNOUNCEMENT, {
    refetchQueries: [{ query: ANNOUNCEMENTS_ADMIN }],
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createAnnouncement({ variables: { input: { title, body, category, isEmergency } } });
    setTitle('');
    setBody('');
    setIsEmergency(false);
    setFormOpen(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t('nagaradhyaksh.announcements.title')}</h1>
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>{t('nagaradhyaksh.announcements.subtitle')}</p>
        </div>
        <Button onClick={() => setFormOpen((v) => !v)}>
          <Plus size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
          {t('nagaradhyaksh.announcements.new')}
        </Button>
      </div>

      {formOpen && (
        <Card title={t('admin.announcements.create')}>
          <form onSubmit={handleSubmit}>
            <Input
              label={t('admin.announcements.titleField')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Select label={t('admin.announcements.category')} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
            <Textarea
              label={t('admin.announcements.body')}
              style={{ flexBasis: '100%' }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
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
              {t('nagaradhyaksh.announcements.markEmergency')}
            </label>
            <div className="action-row">
              <Button type="submit" loading={creating}>
                {t('admin.announcements.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
          {error && <p className="form-error">{error.message}</p>}
          {successMsg && <p className="form-success">{t('admin.announcements.created')}</p>}
        </Card>
      )}

      <Card>
        {loading ? (
          <Skeleton variant="rows" count={4} />
        ) : data?.announcementsAdmin.length === 0 ? (
          <EmptyState icon={FileText} message={t('admin.announcements.empty')} />
        ) : (
          <ul className="request-list">
            {data?.announcementsAdmin.map((a) => (
              <li key={a.id} className="request-list-item">
                <div>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.title}
                    {a.isEmergency && (
                      <Badge tone="danger">
                        <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                        {t('nagaradhyaksh.announcements.emergency')}
                      </Badge>
                    )}
                  </strong>
                  <span className="request-meta">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(t('nagaradhyaksh.announcements.confirmDelete'))) {
                      deleteAnnouncement({ variables: { id: a.id } });
                    }
                  }}
                >
                  {t('common.delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
