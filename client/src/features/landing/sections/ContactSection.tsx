import { useState, type FormEvent } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BORDER, MUTED, NAVY, SERIF, TEXT } from '../palette';
import type { City } from '../../../graphql/types';

export function ContactSection({ city }: { city: City }) {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  // No backend endpoint exists for this yet — this just confirms locally.
  // Wire this up to a real "contact municipality" mutation before relying on it.
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" style={{ width: '100%', maxWidth: 1360, padding: '64px 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#FFFFFF' }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: TEXT, textAlign: 'center' }}>
        {t('marketing.contact.title', { city: city.name })}
      </div>
      <div style={{ width: '100%', maxWidth: 900, marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <MapPin size={20} color={NAVY} />
            <span style={{ fontSize: 14.5, color: TEXT }}>{city.address ?? t('marketing.contact.addressFallback')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Phone size={20} color={NAVY} />
            <span style={{ fontSize: 14.5, color: TEXT }}>{city.contactPhone ?? t('marketing.contact.phoneFallback')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Mail size={20} color={NAVY} />
            <span style={{ fontSize: 14.5, color: TEXT }}>{city.contactEmail ?? t('marketing.contact.emailFallback')}</span>
          </div>
        </div>
        <div>
          {submitted ? (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, fontSize: 14.5, color: MUTED }}>
              {t('marketing.contact.thankYou')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ maxWidth: 'none', boxShadow: 'none', padding: 0, border: 'none', background: 'transparent' }}>
              <label>
                {t('marketing.contact.formName')}
                <input required />
              </label>
              <label>
                {t('marketing.contact.formMessage')}
                <textarea required />
              </label>
              <button type="submit">{t('marketing.contact.formSend')}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
