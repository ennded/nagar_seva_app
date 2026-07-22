import { FileText, Activity, CalendarClock, BellRing, MapPinned, Truck, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BORDER, GREEN, MUTED, SERIF, TEXT } from '../palette';

const FEATURES = [
  { key: 'complaintRegistration', Icon: FileText },
  { key: 'statusTracking', Icon: Activity },
  { key: 'appointmentScheduling', Icon: CalendarClock },
  { key: 'notifications', Icon: BellRing },
  { key: 'wardMonitoring', Icon: MapPinned },
  { key: 'garbageTracking', Icon: Truck },
  { key: 'secureAccess', Icon: ShieldCheck },
];

export function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section id="features" style={{ width: '100%', maxWidth: 1360, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#FFFFFF' }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: TEXT, textAlign: 'center' }}>{t('marketing.features.title')}</div>
      <div style={{ fontSize: 15.5, color: MUTED, marginTop: 8, textAlign: 'center', maxWidth: 640 }}>
        {t('marketing.features.subtitle')}
      </div>
      <div style={{ width: '100%', marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {FEATURES.map((f) => (
          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
            <f.Icon size={22} color={GREEN} />
            <span style={{ fontSize: 14.5, fontWeight: 600, color: TEXT }}>{t(`marketing.features.${f.key}`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
