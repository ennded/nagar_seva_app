import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

export function CityPickerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [slug, setSlug] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = slug.trim().toLowerCase();
    if (trimmed) navigate(`/${trimmed}`);
  }

  return (
    <div className="city-picker-page">
      <h1>{t('common.appName')}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          {t('landing.cityCode')}
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={t('landing.cityCodePlaceholder')} required />
        </label>
        <button type="submit">{t('landing.getStarted')}</button>
      </form>
      <LanguageSwitcher />
    </div>
  );
}
