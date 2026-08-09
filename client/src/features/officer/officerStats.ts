import type { RequestUnion } from '../../graphql/types';

const ACTIVE_STATUSES = new Set(['ASSIGNED', 'IN_PROGRESS', 'SCHEDULED']);

// The backend has no per-request due date, so "overdue" is approximated from a fixed
// SLA-by-priority clock starting when the officer was assigned. Not backed by any
// configured policy — just a reasonable default so the dashboard can flag stale work.
const SLA_DAYS: Record<string, number> = { HIGH: 2, MEDIUM: 5, LOW: 7 };
const DAY_MS = 24 * 60 * 60 * 1000;

export function isActive(r: RequestUnion): boolean {
  return ACTIVE_STATUSES.has(r.status);
}

// A complaint's officer-facing work ends at COMPLETED (admin closes it later); an
// appointment's ends at SCHEDULED (admin closes it after the visit happens).
export function isOfficerDone(r: RequestUnion): boolean {
  if (r.__typename === 'Complaint') return r.status === 'COMPLETED' || r.status === 'CLOSED';
  return r.status === 'SCHEDULED' || r.status === 'CLOSED';
}

export function assignedAt(r: RequestUnion): Date {
  const entry = r.statusHistory.find((e) => e.status === 'ASSIGNED');
  return new Date(entry?.changedAt ?? r.createdAt);
}

export function resolvedAt(r: RequestUnion): Date | null {
  const target = r.__typename === 'Complaint' ? 'COMPLETED' : 'SCHEDULED';
  const entries = r.statusHistory.filter((e) => e.status === target || e.status === 'CLOSED');
  if (entries.length === 0) return null;
  return new Date(entries[entries.length - 1].changedAt);
}

export function slaDeadline(r: RequestUnion): Date {
  const days = SLA_DAYS[r.priority] ?? SLA_DAYS.MEDIUM;
  return new Date(assignedAt(r).getTime() + days * DAY_MS);
}

export function isOverdue(r: RequestUnion, now: Date = new Date()): boolean {
  return isActive(r) && now.getTime() > slaDeadline(r).getTime();
}

export function isResolvedWithinDays(r: RequestUnion, days: number, now: Date = new Date()): boolean {
  const at = resolvedAt(r);
  if (!at) return false;
  return now.getTime() - at.getTime() <= days * DAY_MS;
}

export function wasResolvedOnTime(r: RequestUnion): boolean {
  const at = resolvedAt(r);
  if (!at) return false;
  return at.getTime() <= slaDeadline(r).getTime();
}
