import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Building2, Droplet, Flame, HeartPulse, Phone, Shield, Zap, type LucideIcon } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../../graphql/queries/public.queries';
import type { EmergencyContact } from '../../graphql/types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { NAVY_LIGHT, NAVY, TEXT, MUTED, BORDER } from '../landing/palette';

const CATEGORY_ICON: Record<string, LucideIcon> = {
  POLICE: Shield,
  FIRE: Flame,
  AMBULANCE: HeartPulse,
  MUNICIPALITY: Building2,
  WATER: Droplet,
  ELECTRICITY: Zap,
};

export function CitizenEmergencyContactsPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data, loading } = useQuery<{ emergencyContacts: EmergencyContact[] }>(EMERGENCY_CONTACTS, {
    variables: { citySlug },
  });

  const contacts = data?.emergencyContacts ?? [];

  return (
    <div>
      <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 800, color: TEXT, marginBottom: 4 }}>
        {t('citizenEmergency.title')}
      </h1>
      <p style={{ fontSize: 14, color: MUTED, marginTop: 0, marginBottom: 20 }}>{t('citizenEmergency.subtitle')}</p>

      {loading && <Skeleton variant="rows" count={4} />}
      {!loading && contacts.length === 0 && <EmptyState icon={Phone} message={t('citizenEmergency.empty')} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {contacts.map((c) => {
          const Icon = CATEGORY_ICON[c.category] ?? Phone;
          return (
            <a
              key={c.id}
              href={`tel:${c.phoneNumber}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: '#FFFFFF',
                border: `1px solid ${BORDER}`,
                borderRadius: 14,
                padding: 18,
                textDecoration: 'none',
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: NAVY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={NAVY} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{c.name}</div>
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                  {t(`citizenEmergency.categories.${c.category}`, c.category)}
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{c.phoneNumber}</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
