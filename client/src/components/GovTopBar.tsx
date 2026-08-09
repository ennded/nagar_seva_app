import { useTranslation } from 'react-i18next';
import { NAVY, ORANGE, GREEN, BORDER } from '../features/landing/palette';

export function GovTopBar() {
  const { t, i18n } = useTranslation();

  return (
    <>
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
        <div style={{ flex: 1, height: 4, background: '#FFFFFF', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }} />
        <div style={{ flex: 1, height: 4, background: GREEN }} />
      </div>
    </>
  );
}
