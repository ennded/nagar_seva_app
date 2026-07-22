import { Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BORDER, MUTED, NAVY, NAVY_LIGHT, SERIF, TEXT } from '../palette';

// Illustrative of the actual product flow (verified against the real request lifecycle
// this session) — intentionally not attributed to a specific named person or photo,
// since there are no real citizen accounts to quote yet. Replace with real feedback
// once the platform is live with a municipality.
const KEYS = ['citizen', 'admin', 'nagarsevak'];

export function TestimonialsSection() {
  const { t } = useTranslation();
  return (
    <section id="testimonials" style={{ width: '100%', maxWidth: 1360, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: TEXT, textAlign: 'center' }}>{t('marketing.testimonials.title')}</div>
      <div style={{ fontSize: 15.5, color: MUTED, marginTop: 8, textAlign: 'center', maxWidth: 640 }}>
        {t('marketing.testimonials.subtitle')}
      </div>
      <div style={{ width: '100%', marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {KEYS.map((key) => (
          <div key={key} style={{ border: `1px solid ${BORDER}`, background: '#FFFFFF', borderRadius: 18, padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: NAVY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Quote size={18} color={NAVY} />
            </div>
            <div style={{ fontSize: 14.5, color: TEXT, lineHeight: 1.6 }}>&ldquo;{t(`marketing.testimonials.${key}.quote`)}&rdquo;</div>
            <div style={{ fontSize: 13, color: MUTED, fontWeight: 700 }}>— {t(`marketing.testimonials.${key}.role`)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
