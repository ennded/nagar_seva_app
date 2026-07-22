import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher({ style }: { style?: CSSProperties }) {
  const { i18n } = useTranslation();

  function toggle() {
    i18n.changeLanguage(i18n.language === 'mr' ? 'en' : 'mr');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: '1px solid currentColor',
        borderRadius: 100,
        padding: '9px 16px',
        fontSize: 14,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        minHeight: 'unset',
        boxShadow: 'none',
        ...style,
      }}
    >
      {i18n.language === 'mr' ? 'English' : 'मराठी'}
    </button>
  );
}
