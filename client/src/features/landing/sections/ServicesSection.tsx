import { FileText, CheckCircle2, CalendarClock, Truck, Megaphone, PhoneCall } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BORDER, MUTED, NAVY, NAVY_LIGHT, SERIF, TEXT } from '../palette';

const SERVICES = [
  { key: 'complaint', Icon: FileText },
  { key: 'track', Icon: CheckCircle2 },
  { key: 'appointment', Icon: CalendarClock },
  { key: 'garbage', Icon: Truck },
  { key: 'notices', Icon: Megaphone },
  { key: 'emergency', Icon: PhoneCall },
];

export function ServicesSection() {
  const { t } = useTranslation();
  return (
    <section id="services" style={{ width: '100%', maxWidth: 1360, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#FFFFFF' }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: TEXT, textAlign: 'center' }}>{t('marketing.services.title')}</div>
      <div style={{ fontSize: 15.5, color: MUTED, marginTop: 8, textAlign: 'center', maxWidth: 640 }}>
        {t('marketing.services.subtitle')}
      </div>
      <div style={{ width: '100%', marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {SERVICES.map((s) => (
          <div key={s.key} style={{ border: `1px solid ${BORDER}`, borderRadius: 18, padding: '26px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: NAVY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.Icon size={26} color={NAVY} />
            </div>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: TEXT }}>{t(`marketing.services.${s.key}.title`)}</div>
            <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>{t(`marketing.services.${s.key}.desc`)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
