import { useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, CalendarClock, Truck, Megaphone, BarChart3, Bell, User, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaffLayout } from '../../components/StaffLayout';
import { useAuth } from '../auth/AuthContext';
import type { Notification } from '../../graphql/types';

const NAGARSEVAK_ORANGE = '#D97706';
const NAGARSEVAK_ORANGE_LIGHT = '#FCEEE1';

export function NagarsevakLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { session } = useAuth();
  const base = `/${citySlug}/nagarsevak`;

  function handleNotificationClick(n: Notification) {
    if (n.requestId) navigate(`${base}/requests/${n.requestId}`);
    else navigate(`${base}/notifications`);
  }

  return (
    <StaffLayout
      roleLabel={t('role.NAGARSEVAK')}
      accentColor={NAGARSEVAK_ORANGE}
      accentColorLight={NAGARSEVAK_ORANGE_LIGHT}
      onNotificationClick={handleNotificationClick}
      topbarLeft={
        session?.user.ward && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--color-border)',
              borderRadius: 100,
              padding: '8px 14px',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
            }}
          >
            <MapPin size={15} color={NAGARSEVAK_ORANGE} />
            {session.user.ward.name}
          </div>
        )
      }
      navItems={[
        { to: base, end: true, icon: LayoutDashboard, label: t('monitor.nav.dashboard') },
        { to: `${base}/complaints`, icon: ClipboardList, label: t('monitor.nav.complaints') },
        { to: `${base}/appointments`, icon: CalendarClock, label: t('monitor.nav.appointments') },
        { to: `${base}/garbage`, icon: Truck, label: t('garbage.nav') },
        { to: `${base}/announcements`, icon: Megaphone, label: t('admin.nav.announcements') },
        { to: `${base}/reports`, icon: BarChart3, label: t('monitor.nav.reports') },
        { to: `${base}/notifications`, icon: Bell, label: t('citizen.notifications') },
        { to: `${base}/profile`, icon: User, label: t('monitor.nav.profile') },
      ]}
    />
  );
}
