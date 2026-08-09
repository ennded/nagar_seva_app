import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { CirclePlus, Phone } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../../graphql/queries/public.queries';
import type { EmergencyContact } from '../../graphql/types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ORANGE, GREEN, TEXT, MUTED, BORDER } from '../landing/palette';

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

      <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {contacts.map((c) => {
          return (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: '#FFFFFF',
                border: `1px solid ${BORDER}`,
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FBE9D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CirclePlus size={20} color={ORANGE} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: TEXT }}>{c.name}</div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{c.phoneNumber}</div>
              </div>
              <a
                href={`tel:${c.phoneNumber}`}
                aria-label={`${t('citizenEmergency.call')} ${c.name}`}
                style={{ width: 40, height: 40, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}
              >
                <Phone size={17} color="#FFFFFF" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
