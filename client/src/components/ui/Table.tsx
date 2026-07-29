import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="table-scroll">
      <table className="admin-table">{children}</table>
    </div>
  );
}
