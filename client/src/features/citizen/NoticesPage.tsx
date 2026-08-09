import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';
import { ANNOUNCEMENTS } from '../../graphql/queries/public.queries';
import type { Announcement } from '../../graphql/types';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { TEXT, MUTED, BORDER, ORANGE } from '../landing/palette';

export function NoticesPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading, error } = useQuery<{ announcements: Announcement[] }>(ANNOUNCEMENTS, {
    variables: { citySlug },
    skip: !citySlug,
  });

  const notices = data?.announcements ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 800, color: TEXT }}>
        {t('citizen.noticesTitle')}
      </div>

      {loading && <Skeleton variant="rows" count={4} />}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && notices.length === 0 && (
        <EmptyState icon={Megaphone} message={t('citizen.noNotices')} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {notices.map((n) => (
          <div
            key={n.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              background: '#FFFFFF',
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FBE9D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Megaphone size={20} color={ORANGE} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: TEXT }}>{n.title}</div>
                {n.isEmergency && <Badge tone="danger">{t('citizen.emergencyNotice')}</Badge>}
              </div>
              <div style={{ fontSize: 12.5, color: MUTED, marginTop: 3 }}>
                {new Date(n.publishedAt ?? n.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 13.5, color: TEXT, marginTop: 8, lineHeight: 1.5 }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
