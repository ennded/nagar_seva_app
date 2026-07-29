import { useTranslation } from 'react-i18next';
import type { RequestStatus } from '../graphql/types';
import { Badge, type BadgeTone } from './ui/Badge';

const STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  REGISTERED: 'neutral',
  VERIFIED: 'info',
  ASSIGNED: 'warning',
  IN_PROGRESS: 'warning',
  SCHEDULED: 'info',
  COMPLETED: 'success',
  CLOSED: 'success',
  REJECTED: 'danger',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation();
  return <Badge tone={STATUS_TONE[status]}>{t(`status.${status}`)}</Badge>;
}
