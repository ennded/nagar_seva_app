import { useParams } from 'react-router-dom';
import { Eye, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaffLayout } from '../../components/StaffLayout';

export function NagarsevakLayout() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const base = `/${citySlug}/nagarsevak`;

  return (
    <StaffLayout
      roleLabel={t('role.NAGARSEVAK')}
      navItems={[
        { to: base, end: true, icon: Eye, label: t('monitor.nav.requests') },
        { to: `${base}/garbage`, icon: Truck, label: t('garbage.nav') },
      ]}
    />
  );
}
