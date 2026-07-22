import { useTranslation } from 'react-i18next';
import { BORDER, MUTED, SERIF, TEXT } from '../palette';

const KEYS = ['register', 'track', 'appointment', 'free', 'notifications'];

export function FAQSection() {
  const { t } = useTranslation();
  return (
    <section id="faq" style={{ width: '100%', maxWidth: 900, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: TEXT, textAlign: 'center' }}>{t('marketing.faq.title')}</div>
      <div style={{ width: '100%', marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {KEYS.map((key) => (
          <details key={key} style={{ border: `1px solid ${BORDER}`, background: '#FFFFFF', borderRadius: 14, padding: '16px 20px' }}>
            <summary style={{ fontSize: 15.5, fontWeight: 700, color: TEXT, cursor: 'pointer' }}>{t(`marketing.faq.${key}.q`)}</summary>
            <div style={{ fontSize: 14, color: MUTED, marginTop: 10, lineHeight: 1.6 }}>{t(`marketing.faq.${key}.a`)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
