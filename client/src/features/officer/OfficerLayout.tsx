import { useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, CalendarClock, Bell, BarChart3, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaffLayout } from '../../components/StaffLayout';
import type { Notification } from '../../graphql/types';

export function OfficerLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { citySlug } = useParams<{ citySlug: string }>();
  const base = `/${citySlug}/officer`;

  function handleNotificationClick(n: Notification) {
    if (n.requestId) navigate(`${base}/requests/${n.requestId}`);
    else navigate(`${base}/notifications`);
  }

  return (
    <StaffLayout
      roleLabel={t('role.OFFICER')}
      title={t('officer.portalTitle')}
      onNotificationClick={handleNotificationClick}
      navItems={[
        { to: base, end: true, icon: LayoutDashboard, label: t('officer.nav.dashboard') },
        { to: `${base}/complaints`, icon: ClipboardList, label: t('officer.nav.myComplaints') },
        { to: `${base}/appointments`, icon: CalendarClock, label: t('officer.nav.appointments') },
        { to: `${base}/notifications`, icon: Bell, label: t('officer.nav.notifications') },
        { to: `${base}/performance`, icon: BarChart3, label: t('officer.nav.performance') },
        { to: `${base}/profile`, icon: User, label: t('officer.nav.profile') },
      ]}
    />
  );
}
