import { useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Building2,
  PieChart,
  Truck,
  Megaphone,
  FileBarChart,
  Bell,
  User,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaffLayout } from '../../components/StaffLayout';

export function NagaradhyakshLayout() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const base = `/${citySlug}/nagaradhyaksh`;

  return (
    <StaffLayout
      roleLabel={t('role.NAGARADHYAKSH')}
      navItems={[
        { to: base, end: true, icon: LayoutDashboard, label: t('nagaradhyaksh.nav.dashboard') },
        { to: `${base}/requests`, icon: ClipboardList, label: t('monitor.nav.requests') },
        { to: `${base}/ward-performance`, icon: MapPin, label: t('nagaradhyaksh.nav.wardPerformance') },
        { to: `${base}/department-performance`, icon: Building2, label: t('nagaradhyaksh.nav.departmentPerformance') },
        { to: `${base}/complaint-analytics`, icon: PieChart, label: t('nagaradhyaksh.nav.complaintAnalytics') },
        { to: `${base}/garbage-monitoring`, icon: Truck, label: t('nagaradhyaksh.nav.garbageMonitoring') },
        { to: `${base}/announcements`, icon: Megaphone, label: t('admin.nav.announcements') },
        { to: `${base}/reports`, icon: FileBarChart, label: t('admin.nav.reports') },
        { to: `${base}/notifications`, icon: Bell, label: t('nagaradhyaksh.nav.notifications') },
        { to: `${base}/profile`, icon: User, label: t('nagaradhyaksh.nav.profile') },
        { to: `${base}/settings`, icon: Settings, label: t('nagaradhyaksh.nav.settings') },
      ]}
    />
  );
}
