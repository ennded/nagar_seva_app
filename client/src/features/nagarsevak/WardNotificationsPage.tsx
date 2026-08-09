import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { MARK_NOTIFICATION_READ, MY_NOTIFICATIONS } from '../../graphql/queries/notification.queries';
import type { Notification } from '../../graphql/types';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';

export function WardNotificationsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery<{ myNotifications: Notification[] }>(MY_NOTIFICATIONS);
  const [markNotificationRead] = useMutation<{ markNotificationRead: Notification }>(MARK_NOTIFICATION_READ);

  const notifications = data?.myNotifications ?? [];

  function handleClick(n: Notification) {
    if (!n.isRead) {
      markNotificationRead({ variables: { id: n.id } }).catch(() => {});
    }
    if (n.requestId) navigate(`/${citySlug}/nagarsevak/requests/${n.requestId}`);
  }

  return (
    <div>
      <h1>{t('citizen.notifications')}</h1>

      {loading && <Skeleton variant="rows" count={5} />}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && notifications.length === 0 && <EmptyState icon={Bell} message={t('citizen.noNotifications')} />}

      {!loading && !error && notifications.length > 0 && (
        <ul className="request-list">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="request-list-item"
              style={{ cursor: n.requestId ? 'pointer' : 'default', background: n.isRead ? undefined : 'var(--color-primary-light)' }}
              onClick={() => handleClick(n)}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong>{n.message}</strong>
                <span className="request-meta">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
