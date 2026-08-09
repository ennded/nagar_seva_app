import { useState, type CSSProperties, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Bell, LogOut, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '../features/auth/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { StaffShellFrame } from './StaffShellFrame';
import { MARK_NOTIFICATION_READ, MY_NOTIFICATIONS } from '../graphql/queries/notification.queries';
import type { Notification } from '../graphql/types';

export interface StaffNavItem {
  to: string;
  end?: boolean;
  icon: LucideIcon;
  label: string;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function StaffLayout({
  navItems,
  roleLabel,
  title,
  topbarLeft,
  accentColor,
  accentColorLight,
  onNotificationClick,
}: {
  navItems: StaffNavItem[];
  roleLabel: string;
  title?: string;
  topbarLeft?: ReactNode;
  accentColor?: string;
  accentColorLight?: string;
  onNotificationClick?: (notification: Notification) => void;
}) {
  const { t } = useTranslation();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { citySlug } = useParams<{ citySlug: string }>();
  const [notifOpen, setNotifOpen] = useState(false);

  const accentStyle: CSSProperties | undefined = accentColor
    ? ({ '--role-accent': accentColor, '--role-accent-light': accentColorLight ?? accentColor } as CSSProperties)
    : undefined;

  const { data: notifData } = useQuery<{ myNotifications: Notification[] }>(MY_NOTIFICATIONS);
  const notifications = notifData?.myNotifications ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [markNotificationRead] = useMutation<{ markNotificationRead: Notification }>(MARK_NOTIFICATION_READ);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) {
      markNotificationRead({ variables: { id: n.id } }).catch(() => {});
    }
    setNotifOpen(false);
    onNotificationClick?.(n);
  }

  return (
    <StaffShellFrame style={accentStyle}>
      <aside className="admin-sidebar">
        <Link to={`/${citySlug}`} className="admin-sidebar-brand">
          <img src="/logo.png" alt="" width={28} height={28} />
          {t('common.appName')}
        </Link>
        <div className="admin-sidebar-role">{roleLabel}</div>
        <nav className="admin-nav" aria-label={roleLabel}>
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="admin-nav-link admin-logout" onClick={handleLogout}>
          <LogOut size={22} aria-hidden="true" />
          <span>{t('common.logout')}</span>
        </button>
      </aside>
      <div className="admin-content-area">
        <header className="admin-topbar">
          {topbarLeft ?? <span>{title ?? session?.user.name}</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LanguageSwitcher />

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label={t('citizen.notifications')}
                style={{ position: 'relative', width: 38, height: 38, padding: 0, borderRadius: '50%', border: '1px solid var(--color-border)', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 'unset', boxShadow: 'none' }}
              >
                <Bell size={17} color="var(--color-text)" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, padding: '0 3px', borderRadius: 100, background: '#DC2626', color: '#FFFFFF', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: 46, width: 300, maxHeight: 360, overflowY: 'auto', background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: '0 12px 32px rgba(20,24,28,0.14)', zIndex: 20 }}>
                  <div style={{ padding: '12px 16px', fontWeight: 800, fontSize: 14, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>{t('citizen.notifications')}</div>
                  {notifications.length === 0 && (
                    <div style={{ padding: 16, fontSize: 13, color: 'var(--color-muted)' }}>{t('citizen.noNotifications')}</div>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid var(--color-border)', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0, fontSize: 13, color: 'var(--color-text)', background: n.isRead ? 'transparent' : 'var(--color-primary-light)', cursor: 'pointer', minHeight: 'unset', boxShadow: 'none' }}
                    >
                      <div>{n.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {session && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--role-accent, var(--color-primary))', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}>
                  {initials(session.user.name)}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{session.user.name}</span>
              </div>
            )}
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </StaffShellFrame>
  );
}
