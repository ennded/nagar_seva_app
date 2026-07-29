import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const TONE_STYLE: Record<BadgeTone, { background: string; color: string }> = {
  neutral: { background: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  info: { background: '#dbeafe', color: '#1d4ed8' },
  warning: { background: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  success: { background: 'var(--color-success-light)', color: 'var(--color-success)' },
  danger: { background: 'var(--color-danger-light)', color: 'var(--color-danger)' },
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className="status-badge" style={TONE_STYLE[tone]}>
      {children}
    </span>
  );
}
