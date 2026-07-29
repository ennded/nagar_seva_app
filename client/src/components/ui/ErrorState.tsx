import { AlertTriangle } from 'lucide-react';

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state">
      <div className="error-state-icon">
        <AlertTriangle size={20} color="var(--color-danger)" aria-hidden="true" />
      </div>
      <p className="error-state-message">{message}</p>
    </div>
  );
}
