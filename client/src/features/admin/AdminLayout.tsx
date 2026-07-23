import { useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Users,
  ClipboardList,
  Megaphone,
  Phone,
  Truck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaffLayout } from '../../components/StaffLayout';

export function AdminLayout() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const base = `/${citySlug}/admin`;

  return (
    <StaffLayout
      roleLabel={t('role.ADMIN')}
      navItems={[
        { to: base, end: true, icon: LayoutDashboard, label: t('admin.nav.dashboard') },
        { to: `${base}/requests`, icon: ClipboardList, label: t('admin.nav.requests') },
        { to: `${base}/wards`, icon: MapPin, label: t('admin.nav.wards') },
        { to: `${base}/departments`, icon: Building2, label: t('admin.nav.departments') },
        { to: `${base}/staff`, icon: Users, label: t('admin.nav.staff') },
        { to: `${base}/vehicles`, icon: Truck, label: t('admin.vehicles.title') },
        { to: `${base}/announcements`, icon: Megaphone, label: t('admin.nav.announcements') },
        { to: `${base}/emergency-contacts`, icon: Phone, label: t('admin.nav.emergencyContacts') },
      ]}
    />
  );
}
