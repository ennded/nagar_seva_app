export type SkeletonVariant = 'text' | 'tiles' | 'rows';

export function Skeleton({ variant = 'text', count = 3 }: { variant?: SkeletonVariant; count?: number }) {
  if (variant === 'tiles') {
    return (
      <div className="stats-row" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton skeleton-tile" />
        ))}
      </div>
    );
  }
  if (variant === 'rows') {
    return (
      <div aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton skeleton-row" />
        ))}
      </div>
    );
  }
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  );
}
