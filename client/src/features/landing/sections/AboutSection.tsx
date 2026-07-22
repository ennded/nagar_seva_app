import { Landmark, ShieldCheck, TrendingUp, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BORDER, GREEN, GREEN_LIGHT, MUTED, SERIF, TEXT } from '../palette';

const POINTS = [
  { key: 'governance', Icon: Landmark },
  { key: 'transparency', Icon: ShieldCheck },
  { key: 'resolution', Icon: TrendingUp },
  { key: 'communication', Icon: MessageSquare },
];

export function AboutSection() {
  const { t } = useTranslation();
  return (
    <section id="about" style={{ width: '100%', maxWidth: 1360, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: TEXT, textAlign: 'center' }}>{t('marketing.about.title')}</div>
      <div style={{ fontSize: 15.5, color: MUTED, marginTop: 8, textAlign: 'center', maxWidth: 640 }}>
        {t('marketing.about.subtitle')}
      </div>
      <div style={{ width: '100%', marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {POINTS.map((p) => (
          <div key={p.key} style={{ border: `1px solid ${BORDER}`, background: '#FFFFFF', borderRadius: 18, padding: '26px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: GREEN_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p.Icon size={26} color={GREEN} />
            </div>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: TEXT }}>{t(`marketing.about.${p.key}.title`)}</div>
            <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>{t(`marketing.about.${p.key}.desc`)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
