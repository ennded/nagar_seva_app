import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'मराठी' },
];

export function NagaradhyakshSettingsPage() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('nagaradhyaksh.settings.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('nagaradhyaksh.settings.subtitle')}</p>

      <Card title={t('nagaradhyaksh.settings.language')} style={{ maxWidth: 480 }}>
        <div className="action-row">
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant={i18n.language === lang.code ? 'primary' : 'secondary'}
              onClick={() => i18n.changeLanguage(lang.code)}
            >
              {lang.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
