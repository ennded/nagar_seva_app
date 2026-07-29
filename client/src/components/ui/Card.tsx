import type { ReactNode, CSSProperties } from 'react';

export function Card({
  title,
  children,
  style,
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const classes = ['admin-panel', className].filter(Boolean).join(' ');
  return (
    <div className={classes} style={style}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}
