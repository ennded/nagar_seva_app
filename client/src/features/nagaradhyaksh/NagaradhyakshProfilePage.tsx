import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ME } from '../../graphql/queries/auth.queries';
import { CITY_BY_SLUG } from '../../graphql/queries/public.queries';
import { useAuth } from '../../features/auth/AuthContext';
import type { UserFields, City } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

const NAGARADHYAKSH_NAVY = '#0B3D66';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function NagaradhyakshProfilePage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data, loading } = useQuery<{ me: UserFields | null }>(ME);
  const { data: cityData } = useQuery<{ cityBySlug: City | null }>(CITY_BY_SLUG, {
    variables: { slug: session?.citySlug },
    skip: !session?.citySlug,
  });
  const me = data?.me;
  const city = cityData?.cityBySlug;

  if (loading) return <Skeleton variant="rows" count={5} />;
  if (!me) return null;

  return (
    <div>
      <h1>{t('nagaradhyaksh.profile.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('nagaradhyaksh.profile.subtitle')}</p>

      <Card style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: NAGARADHYAKSH_NAVY,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initials(me.name)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>{me.name}</div>
            <div style={{ fontSize: 13.5, color: 'var(--color-muted)' }}>
              {t('role.NAGARADHYAKSH')}
              {city ? ` · ${city.name}` : ''}
            </div>
          </div>
        </div>

        <div>
          {[
            { label: t('nagaradhyaksh.profile.municipality'), value: city?.name ?? '—' },
            { label: t('nagaradhyaksh.profile.designation'), value: t('role.NAGARADHYAKSH') },
            { label: t('nagaradhyaksh.profile.phone'), value: me.mobile },
            { label: t('nagaradhyaksh.profile.email'), value: me.email ?? t('nagaradhyaksh.profile.notProvided') },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '0.85rem 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span style={{ color: 'var(--color-muted)' }}>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
