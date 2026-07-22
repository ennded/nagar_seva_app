import { useParams } from 'react-router-dom';
import { ClipboardList, CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaffLayout } from '../../components/StaffLayout';

export function OfficerLayout() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const base = `/${citySlug}/officer`;

  return (
    <StaffLayout
      roleLabel={t('role.OFFICER')}
      navItems={[
        { to: base, end: true, icon: ClipboardList, label: t('officer.nav.myWork') },
        { to: `${base}/availability`, icon: CalendarClock, label: t('officer.nav.availability') },
      ]}
    />
  );
}
