import { useTranslation } from 'react-i18next';
import type { RequestStatus } from '../graphql/types';

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation();
  return <span className={`status-badge status-${status.toLowerCase()}`}>{t(`status.${status}`)}</span>;
}
