import { useParams } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Megaphone } from 'lucide-react';
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
        { to: base, end: true, icon: LayoutDashboard, label: t('monitor.nav.overview') },
        { to: `${base}/requests`, icon: ClipboardList, label: t('monitor.nav.requests') },
        { to: `${base}/announcements`, icon: Megaphone, label: t('admin.nav.announcements') },
      ]}
    />
  );
}
