import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  FileText,
  CheckCircle2,
  XCircle,
  UserCheck,
  Activity,
  Calendar,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { MY_NOTIFICATIONS, MARK_NOTIFICATION_READ } from '../../graphql/queries/notification.queries';
import type { Notification } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

const TYPE_ICON: Record<string, LucideIcon> = {
  new_request: FileText,
  request_verified: CheckCircle2,
  request_rejected: XCircle,
  request_assigned: UserCheck,
  request_in_progress: Activity,
  request_completed: CheckCircle2,
  request_closed: CheckCircle2,
  appointment_scheduled: Calendar,
  announcement_published: Megaphone,
};

export function NagaradhyakshNotificationsPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ myNotifications: Notification[] }>(MY_NOTIFICATIONS);
  const [markRead] = useMutation(MARK_NOTIFICATION_READ, { refetchQueries: [{ query: MY_NOTIFICATIONS }] });
  const notifications = data?.myNotifications ?? [];

  return (
    <div>
      <h1>{t('nagaradhyaksh.notifications.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('nagaradhyaksh.notifications.subtitle')}</p>

      <Card>
        {loading ? (
          <Skeleton variant="rows" count={5} />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} message={t('nagaradhyaksh.notifications.empty')} />
        ) : (
          <ul className="request-list">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              return (
                <li
                  key={n.id}
                  className="request-list-item"
                  style={{ cursor: n.isRead ? 'default' : 'pointer', opacity: n.isRead ? 0.7 : 1 }}
                  onClick={() => {
                    if (!n.isRead) markRead({ variables: { id: n.id } });
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div className="stat-tile-icon" style={{ margin: 0, width: 36, height: 36, flexShrink: 0 }}>
                      <Icon size={16} color="#0B3D66" />
                    </div>
                    <div>
                      <strong>{n.message}</strong>
                      <div className="request-meta">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
