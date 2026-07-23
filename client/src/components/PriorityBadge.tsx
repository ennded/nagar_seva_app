import type { RequestPriority } from '../graphql/types';

const PRIORITY_COLOR: Record<RequestPriority, string> = {
  HIGH: '#C0392B',
  MEDIUM: '#B85B12',
  LOW: '#1E8A5F',
};

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  return (
    <span style={{ fontSize: 12.5, fontWeight: 700, color: PRIORITY_COLOR[priority] }}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}
