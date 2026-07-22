import { Truck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StaffLayout } from '../../components/StaffLayout';

export function DriverLayout() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const base = `/${citySlug}/driver`;

  return <StaffLayout roleLabel={t('role.DRIVER')} navItems={[{ to: base, end: true, icon: Truck, label: t('role.DRIVER') }]} />;
}
