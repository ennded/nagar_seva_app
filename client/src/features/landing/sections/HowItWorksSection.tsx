import { FileEdit, ShieldCheck, Wrench, BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GREEN, MUTED, NAVY, NAVY_LIGHT, SERIF, TEXT } from '../palette';

const STEPS = [
  { key: 'submit', Icon: FileEdit },
  { key: 'verify', Icon: ShieldCheck },
  { key: 'resolve', Icon: Wrench },
  { key: 'notify', Icon: BellRing },
];

export function HowItWorksSection() {
  const { t } = useTranslation();
  return (
    <section id="how-it-works" style={{ width: '100%', maxWidth: 1360, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: TEXT, textAlign: 'center' }}>{t('marketing.howItWorks.title')}</div>
      <div style={{ fontSize: 15.5, color: MUTED, marginTop: 8, textAlign: 'center', maxWidth: 640 }}>
        {t('marketing.howItWorks.subtitle')}
      </div>
      <div style={{ width: '100%', marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: NAVY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.Icon size={28} color={NAVY} />
              </div>
              <div style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', background: GREEN, color: '#FFFFFF', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i + 1}
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>
              {t('marketing.howItWorks.stepLabel', { n: i + 1, title: t(`marketing.howItWorks.${s.key}.title`) })}
            </div>
            <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.5, maxWidth: 220 }}>{t(`marketing.howItWorks.${s.key}.desc`)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
