import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { CITY_BY_SLUG } from '../graphql/queries/public.queries';
import type { City } from '../graphql/types';
import { NAVY, NAVY_DARK, ORANGE, GREEN } from '../features/landing/palette';

export function Footer({ citySlug }: { citySlug: string }) {
  const { t } = useTranslation();
  const { data } = useQuery<{ cityBySlug: City | null }>(CITY_BY_SLUG, {
    variables: { slug: citySlug },
    fetchPolicy: 'cache-first',
  });
  const city = data?.cityBySlug;
  const cityName = city?.name ?? t('common.appName');

  return (
    <div style={{ width: '100%', marginTop: 'auto' }}>
      <div style={{ width: '100%', display: 'flex' }}>
        <div style={{ flex: 1, height: 4, background: ORANGE }} />
        <div style={{ flex: 1, height: 4, background: '#FFFFFF' }} />
        <div style={{ flex: 1, height: 4, background: GREEN }} />
      </div>
      <div style={{ width: '100%', background: NAVY, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1360, padding: '40px 24px 24px', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 800, color: '#FFFFFF' }}>{t('common.appName')}</div>
            <div style={{ fontSize: 13.5, color: '#B9C6D2', marginTop: 10, lineHeight: 1.6, maxWidth: 280 }}>
              {t('marketing.footer.description')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12 }}>
              {t('marketing.footer.quickLinks')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: '#B9C6D2' }}>
              <span>{t('citizenHome.quickActions.registerComplaint.title')}</span>
              <span>{t('citizen.trackComplaint')}</span>
              <span>{t('citizen.notices')}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12 }}>
              {t('marketing.footer.policies')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: '#B9C6D2' }}>
              <span>{t('marketing.footer.termsOfUse')}</span>
              <span>{t('marketing.footer.privacyPolicy')}</span>
              <span>{t('marketing.footer.accessibilityStatement')}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12 }}>
              {t('marketing.footer.contact')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: '#B9C6D2' }}>
              {t('marketing.footer.helpline')}
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15 }}>{city?.contactPhone ?? '1800-123-4567'}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', background: NAVY_DARK, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1360, padding: '14px 24px', fontSize: 12.5, color: '#8FA3B5' }}>
          © {new Date().getFullYear()} {cityName} {t('marketing.footer.copyright')}
        </div>
      </div>
    </div>
  );
}
