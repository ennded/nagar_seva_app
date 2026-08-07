import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';
import { ANNOUNCEMENTS } from '../../graphql/queries/public.queries';
import type { Announcement } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';

export function NoticesPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading, error } = useQuery<{ announcements: Announcement[] }>(ANNOUNCEMENTS, {
    variables: { citySlug },
    skip: !citySlug,
  });

  const notices = data?.announcements ?? [];

  return (
    <div>
      <h1>{t('citizen.notices')}</h1>

      {loading && <Skeleton variant="rows" count={4} />}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && notices.length === 0 && (
        <EmptyState icon={Megaphone} message={t('citizen.noNotices')} />
      )}

      {!loading && !error && notices.length > 0 && (
        <ul className="request-list">
          {notices.map((n) => (
            <li key={n.id} className="request-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <Card style={{ width: '100%' }}>
                <strong>{n.title}</strong>
                <span className="request-meta">
                  {n.category.replace(/_/g, ' ')}
                  {n.publishedAt ? ` · ${new Date(n.publishedAt).toLocaleDateString()}` : ''}
                </span>
                <p>{n.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
