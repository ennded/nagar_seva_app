import type { ReactNode, CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';

export function AuthCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  children,
  footer,
}: {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const iconStyle: CSSProperties | undefined = iconColor ? { borderColor: iconColor, color: iconColor } : undefined;

  return (
    <div className="auth-page-outer">
      <div className="auth-card">
        <div className="auth-card-stripe">
          <div style={{ background: '#E07A1F' }} />
          <div style={{ background: '#0B3D66' }} />
          <div style={{ background: '#1E8A5F' }} />
        </div>
        <div className="auth-card-body">
          <div className="auth-card-icon" style={iconStyle}>
            <Icon size={26} />
          </div>
          <h1>{title}</h1>
          {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="auth-card-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
