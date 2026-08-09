import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Bell, ChevronDown, FileText, LogOut, Megaphone, MapPin, Phone, PlusCircle, Trash2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { GovTopBar } from './GovTopBar';
import { Footer } from './Footer';
import { MARK_NOTIFICATION_READ, MY_NOTIFICATIONS } from '../graphql/queries/notification.queries';
import type { Notification } from '../graphql/types';
import { NAVY, TEXT, MUTED, BORDER, NAVY_LIGHT } from '../features/landing/palette';

export function DashboardLayout() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: notifData } = useQuery<{ myNotifications: Notification[] }>(MY_NOTIFICATIONS);
  const notifications = notifData?.myNotifications ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [markNotificationRead] = useMutation<{ markNotificationRead: Notification }>(MARK_NOTIFICATION_READ);

  function handleLogout() {
    logout();
    navigate(`/${citySlug}`);
  }

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) {
      markNotificationRead({ variables: { id: n.id } }).catch(() => {});
    }
    setNotifOpen(false);
    if (n.requestId) {
      navigate(`/${citySlug}/citizen/requests/${n.requestId}`);
    } else if (n.announcementId) {
      navigate(`/${citySlug}/citizen/notices`);
    }
  }

  const navItems = [
    { to: `/${citySlug}/citizen`, end: true, icon: FileText, label: t('citizen.home') },
    { to: `/${citySlug}/citizen/new-complaint`, end: false, icon: PlusCircle, label: t('citizenHome.quickActions.registerComplaint.title') },
    { to: `/${citySlug}/citizen/requests`, end: false, icon: FileText, label: t('citizen.trackComplaint') },
    { to: `/${citySlug}/citizen/garbage`, end: false, icon: Trash2, label: t('garbage.nav') },
    { to: `/${citySlug}/citizen/notices`, end: false, icon: Megaphone, label: t('citizen.notices') },
    { to: `/${citySlug}/citizen/emergency-contacts`, end: false, icon: Phone, label: t('citizenEmergency.title') },
  ];

  return (
    <div className="app-shell" style={{ background: '#EEF2F6' }}>
      <GovTopBar />

      <div style={{ width: '100%', background: '#FFFFFF', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1360, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <NavLink to={`/${citySlug}/citizen`} end style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo.png" alt="" width={40} height={40} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 17, fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>{t('common.appName')}</div>
              <div style={{ fontSize: 10.5, color: MUTED, fontWeight: 600 }}>{t('common.portalSubtitle')}</div>
            </div>
          </NavLink>

          <nav style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, flex: '1 1 auto', minWidth: 0 }} aria-label={t('citizen.dashboard')}>
            {navItems.map(({ to, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={({ isActive }) => ({
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  color: isActive ? NAVY : TEXT,
                  background: isActive ? NAVY_LIGHT : 'transparent',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {session?.user.ward && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' }}>
                <MapPin size={14} color={NAVY} />
                {session.user.ward.name}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                aria-label={t('citizen.notifications')}
                style={{ position: 'relative', width: 40, height: 40, padding: 0, borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 'unset', boxShadow: 'none' }}
              >
                <Bell size={18} color={TEXT} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, padding: '0 3px', borderRadius: 100, background: '#DC2626', color: '#FFFFFF', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: 48, width: 300, maxHeight: 360, overflowY: 'auto', background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 12px 32px rgba(20,24,28,0.14)', zIndex: 20 }}>
                  <div style={{ padding: '12px 16px', fontWeight: 800, fontSize: 14, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>{t('citizen.notifications')}</div>
                  {notifications.length === 0 && (
                    <div style={{ padding: 16, fontSize: 13, color: MUTED }}>{t('citizen.noNotifications')}</div>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0, fontSize: 13, color: TEXT, background: n.isRead ? 'transparent' : NAVY_LIGHT, cursor: 'pointer', minHeight: 'unset', boxShadow: 'none' }}
                    >
                      <div>{n.message}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '6px 12px 6px 6px', background: '#FFFFFF', cursor: 'pointer', minHeight: 'unset', boxShadow: 'none' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: NAVY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserIcon size={15} color={NAVY} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>{session?.user.name}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{t('citizen.myProfile')}</div>
                </div>
                <ChevronDown size={14} color={MUTED} />
              </button>
              {profileOpen && (
                <div style={{ position: 'absolute', right: 0, top: 52, width: 200, background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 12px 32px rgba(20,24,28,0.14)', zIndex: 20, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#DC2626', minHeight: 'unset', boxShadow: 'none' }}
                  >
                    <LogOut size={16} />
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="app-main" style={{ maxWidth: 1360, padding: '1.5rem' }}>
        <Outlet />
      </main>

      <Footer citySlug={citySlug ?? ''} />
    </div>
  );
}
