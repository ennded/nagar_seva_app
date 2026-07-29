import type { RequestPriority } from '../graphql/types';
import { Badge, type BadgeTone } from './ui/Badge';

const PRIORITY_TONE: Record<RequestPriority, BadgeTone> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{priority.charAt(0) + priority.slice(1).toLowerCase()}</Badge>;
}
