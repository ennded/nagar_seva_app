import type { ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon = Inbox,
  message,
  action,
}: {
  icon?: LucideIcon;
  message: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={22} aria-hidden="true" />
      </div>
      <p className="empty-state-message">{message}</p>
      {action}
    </div>
  );
}
