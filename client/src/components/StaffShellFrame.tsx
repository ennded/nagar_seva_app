import type { ReactNode } from 'react';

// The card-framed shell every staff role dashboard shares: centered, rounded, shadowed,
// with a tricolor top stripe (orange/navy/green) — matches the design system exactly.
export function StaffShellFrame({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell-outer">
      <div className="admin-shell">
        <div className="admin-shell-stripe">
          <div style={{ background: '#E07A1F' }} />
          <div style={{ background: '#0B3D66' }} />
          <div style={{ background: '#1E8A5F' }} />
        </div>
        <div className="admin-shell-body">{children}</div>
      </div>
    </div>
  );
}
