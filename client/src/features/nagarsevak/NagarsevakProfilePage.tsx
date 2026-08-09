import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ME } from '../../graphql/queries/auth.queries';
import type { UserFields } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

const NAGARSEVAK_ORANGE = '#D97706';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function NagarsevakProfilePage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ me: UserFields | null }>(ME);
  const me = data?.me;

  if (loading) return <Skeleton variant="rows" count={5} />;
  if (!me) return null;

  return (
    <div>
      <h1>{t('monitor.profile.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('monitor.profile.subtitle')}</p>

      <Card style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: NAGARSEVAK_ORANGE, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
            {initials(me.name)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>{me.name}</div>
            <div style={{ fontSize: 13.5, color: 'var(--color-muted)' }}>
              {t('role.NAGARSEVAK')}
              {me.ward ? ` · ${me.ward.name}` : ''}
            </div>
          </div>
        </div>

        <div>
          {[
            { label: t('auth.ward'), value: me.ward?.name ?? '—' },
            { label: t('monitor.profile.designation'), value: t('role.NAGARSEVAK') },
            { label: t('monitor.profile.phone'), value: me.mobile },
            ...(me.email ? [{ label: t('monitor.profile.email'), value: me.email }] : []),
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
