import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import {
  User,
  Users,
  FileText,
  Bell,
  BarChart3,
  Trash2,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import {
  CITY_BY_SLUG,
  DEPARTMENTS_BY_CITY,
  PUBLIC_DASHBOARD_STATS,
} from '../../graphql/queries/public.queries';
import type { City, DepartmentRef, PublicDashboardStats } from '../../graphql/types';
import { NAVY, NAVY_DARK, ORANGE, GREEN, BG, TEXT, MUTED, BORDER, NAVY_LIGHT, GREEN_LIGHT } from './palette';
import { AboutSection } from './sections/AboutSection';
import { ServicesSection } from './sections/ServicesSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FAQSection } from './sections/FAQSection';
import { ContactSection } from './sections/ContactSection';

const ROLE_META = [
  { id: 'citizen', key: 'citizen', Icon: User, iconBg: NAVY_LIGHT, iconColor: NAVY, btn: NAVY, to: (city: string) => `/${city}/login` },
  { id: 'admin', key: 'admin', Icon: Users, iconBg: GREEN_LIGHT, iconColor: GREEN, btn: GREEN, to: (city: string) => `/${city}/staff-login/admin` },
  { id: 'officer', key: 'officer', Icon: FileText, iconBg: '#EFE9FB', iconColor: '#6B46C1', btn: '#6B46C1', to: (city: string) => `/${city}/staff-login/officer` },
  { id: 'nagarsevak', key: 'nagarsevak', Icon: Bell, iconBg: '#FCEEE1', iconColor: '#D97706', btn: '#D97706', to: (city: string) => `/${city}/staff-login/nagarsevak` },
  { id: 'nagaradhyaksh', key: 'nagaradhyaksh', Icon: BarChart3, iconBg: '#FBEAEA', iconColor: '#DC2626', btn: '#DC2626', to: (city: string) => `/${city}/staff-login/nagaradhyaksh` },
  { id: 'driver', key: 'driver', Icon: Trash2, iconBg: '#E3F4F7', iconColor: '#0891B2', btn: '#0891B2', to: (city: string) => `/${city}/staff-login/driver` },
];

export function LandingPage() {
  const { citySlug = '' } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { data: cityData, loading: cityLoading } = useQuery<{ cityBySlug: City | null }>(CITY_BY_SLUG, {
    variables: { slug: citySlug },
  });
  const { data: statsData } = useQuery<{ publicDashboardStats: PublicDashboardStats }>(PUBLIC_DASHBOARD_STATS, {
    variables: { citySlug },
    skip: !cityData?.cityBySlug,
  });
  const { data: deptData } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, {
    variables: { citySlug },
    skip: !cityData?.cityBySlug,
  });

  if (cityLoading) return <p style={{ padding: 40, fontFamily: 'Public Sans, sans-serif' }}>{t('common.loading')}</p>;
  if (!cityData?.cityBySlug) {
    return (
      <p style={{ padding: 40, fontFamily: 'Public Sans, sans-serif' }}>{t('marketing.cityNotFound', { citySlug })}</p>
    );
  }

  const city = cityData.cityBySlug;
  const stats = statsData?.publicDashboardStats;

  const landingStats = [
    { Icon: User, value: stats ? stats.totalCitizens.toLocaleString('en-IN') : '—', label: t('marketing.stats.citizensServed') },
    {
      Icon: FileText,
      value: stats ? stats.totalResolvedComplaints.toLocaleString('en-IN') : '—',
      label: t('marketing.stats.complaintsResolved'),
    },
    { Icon: MapPin, value: stats ? String(stats.totalWards) : '—', label: t('marketing.stats.wards') },
    { Icon: Users, value: deptData ? String(deptData.departmentsByCity.length) : '—', label: t('marketing.stats.departments') },
    { Icon: Bell, value: '24x7', label: t('marketing.stats.digitalServices') },
  ];

  const ROLES = ROLE_META.map((r) => ({
    ...r,
    label: t(`marketing.roles.${r.key}.label`),
    desc: t(`marketing.roles.${r.key}.desc`),
  }));

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const NAV_LINKS = [
    { label: t('marketing.nav.home'), id: 'roles' },
    { label: t('marketing.nav.about'), id: 'about' },
    { label: t('marketing.nav.services'), id: 'services' },
    { label: t('marketing.nav.howItWorks'), id: 'how-it-works' },
    { label: t('marketing.nav.notices'), id: null },
    { label: t('marketing.nav.contact'), id: 'contact' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: "'Public Sans', system-ui, sans-serif",
        width: '100%',
        background: BG,
      }}
    >
      <div style={{ width: '100%', background: NAVY, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 1360,
            padding: '9px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontSize: 12.5, color: '#D8E2EC', fontWeight: 600 }}>{t('marketing.topBar')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12.5, color: '#D8E2EC', fontWeight: 600 }}>
            <span>A- &nbsp;A &nbsp;A+</span>
            <span>
              <button
                type="button"
                onClick={() => i18n.changeLanguage('en')}
                style={{ background: 'none', border: 'none', boxShadow: 'none', minHeight: 'unset', padding: 0, color: i18n.language === 'en' ? '#FFFFFF' : '#D8E2EC', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
              >
                English
              </button>
              {' | '}
              <button
                type="button"
                onClick={() => i18n.changeLanguage('mr')}
                style={{ background: 'none', border: 'none', boxShadow: 'none', minHeight: 'unset', padding: 0, color: i18n.language === 'mr' ? '#FFFFFF' : '#D8E2EC', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
              >
                मराठी
              </button>
            </span>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex' }}>
        <div style={{ flex: 1, height: 4, background: ORANGE }} />
        <div style={{ flex: 1, height: 4, background: '#FFFFFF', borderTop: '1px solid #E2E6EA', borderBottom: '1px solid #E2E6EA' }} />
        <div style={{ flex: 1, height: 4, background: GREEN }} />
      </div>

      <div style={{ width: '100%', background: '#FFFFFF', borderBottom: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1360, padding: '14px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${NAVY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 800, fontSize: 16, color: NAVY }}>नस</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>नागर सेवा</div>
              <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>आपले शहर, आपली जबाबदारी</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '9px 16px', fontSize: 14, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' }}>
              <MapPin size={15} color={NAVY} />
              {city.name}
            </div>
            <LanguageSwitcher style={{ color: TEXT, borderColor: BORDER }} />
          </div>
        </div>
        <div style={{ width: '100%', maxWidth: 1360, padding: '0 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, overflowX: 'auto' }}>
          {NAV_LINKS.map(({ label, id }, i) => (
            <button
              key={label}
              type="button"
              onClick={() => id && scrollToId(id)}
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: i === 0 ? NAVY : TEXT,
                borderBottom: i === 0 ? `2px solid ${NAVY}` : 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                padding: '8px 14px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: 'transparent',
                boxShadow: 'none',
                minHeight: 'unset',
                cursor: id ? 'pointer' : 'default',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', position: 'relative', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(120deg, ${NAVY} 0%, #14538c 55%, ${GREEN} 130%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.85) 32%, rgba(255,255,255,0.35) 58%, rgba(255,255,255,0.05) 78%)',
          }}
        />
        <div style={{ width: '100%', maxWidth: 1360, padding: '64px 24px 100px', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: GREEN_LIGHT, color: GREEN, padding: '8px 16px', borderRadius: 100, fontSize: 13.5, fontWeight: 700 }}>
            {t('marketing.hero.badge')}
          </div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 46, fontWeight: 800, color: TEXT, lineHeight: 1.18, marginTop: 20, maxWidth: 620 }}>
            {t('marketing.hero.headlinePrefix')} <span style={{ color: NAVY }}>{t('marketing.hero.headlineHighlight')}</span>
          </div>
          <div style={{ fontSize: 17, color: '#3A4450', marginTop: 16, maxWidth: 520, lineHeight: 1.6 }}>
            {t('marketing.hero.subtitle')}
          </div>
          <button
            onClick={() => scrollToId('roles')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 28,
              height: 56,
              padding: '0 26px',
              border: 'none',
              borderRadius: 14,
              background: NAVY,
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: 'pointer',
              minHeight: 'unset',
              boxShadow: 'none',
            }}
          >
            {t('marketing.hero.cta')}
            <ChevronRight size={18} color="#FFFFFF" />
          </button>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 1360, padding: '0 24px', marginTop: -40, position: 'relative', zIndex: 2 }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 18,
            boxShadow: '0 20px 50px rgba(20,24,28,0.12)',
            padding: '28px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 12,
          }}
        >
          {landingStats.map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: NAVY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.Icon size={22} color={NAVY} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: MUTED, fontWeight: 600, marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="roles" style={{ width: '100%', maxWidth: 1360, padding: '64px 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, fontWeight: 800, color: TEXT, textAlign: 'center' }}>
          {t('marketing.roles.title')}
        </div>
        <div style={{ fontSize: 15.5, color: MUTED, marginTop: 8, textAlign: 'center' }}>
          {t('marketing.roles.subtitle')}
        </div>
        <div style={{ width: '100%', marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
          {ROLES.map((role) => (
            <div
              key={role.id}
              style={{
                border: `1px solid ${BORDER}`,
                background: '#FFFFFF',
                borderRadius: 18,
                padding: '26px 18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 14,
                height: '100%',
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: role.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <role.Icon size={30} color={role.iconColor} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16.5, fontWeight: 800, color: TEXT }}>{role.label}</div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>{role.desc}</div>
              </div>
              <button
                onClick={() => navigate(role.to(citySlug))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  justifyContent: 'center',
                  height: 46,
                  border: 'none',
                  borderRadius: 12,
                  background: role.btn,
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  marginTop: 'auto',
                  minHeight: 'unset',
                  boxShadow: 'none',
                }}
              >
                {t('marketing.roles.selectRole')}
                <ChevronRight size={15} color="#FFFFFF" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <AboutSection />
      <ServicesSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection city={city} />

      <div style={{ width: '100%', display: 'flex', marginTop: 'auto' }}>
        <div style={{ flex: 1, height: 4, background: ORANGE }} />
        <div style={{ flex: 1, height: 4, background: '#FFFFFF' }} />
        <div style={{ flex: 1, height: 4, background: GREEN }} />
      </div>
      <div style={{ width: '100%', background: NAVY, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1360, padding: '40px 24px 24px', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 800, color: '#FFFFFF' }}>नागर सेवा</div>
            <div style={{ fontSize: 13.5, color: '#B9C6D2', marginTop: 10, lineHeight: 1.6, maxWidth: 280 }}>
              {t('marketing.footer.description')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12 }}>
              {t('marketing.footer.quickLinks')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: '#B9C6D2' }}>
              <span>{t('marketing.nav.about')}</span>
              <span>{t('marketing.nav.services')}</span>
              <span>{t('marketing.nav.howItWorks')}</span>
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
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15 }}>1800-123-4567</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', background: NAVY_DARK, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1360, padding: '14px 24px', fontSize: 12.5, color: '#8FA3B5' }}>
          © {new Date().getFullYear()} {city.name} {t('marketing.footer.copyright')}
        </div>
      </div>
    </div>
  );
}
