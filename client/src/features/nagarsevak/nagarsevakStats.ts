import type { RequestSummary } from '../../graphql/types';

const DAY_MS = 24 * 60 * 60 * 1000;

function isSameDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function isComplaint(r: RequestSummary): boolean {
  return r.__typename === 'Complaint';
}

export function isAppointment(r: RequestSummary): boolean {
  return r.__typename === 'Appointment';
}

// "Awaiting assignment" — registered/verified but not yet handed to an officer.
export function isOpenComplaint(r: RequestSummary): boolean {
  return isComplaint(r) && (r.status === 'REGISTERED' || r.status === 'VERIFIED');
}

export function isResolvedToday(r: RequestSummary, now: Date = new Date()): boolean {
  return isComplaint(r) && r.status === 'CLOSED' && !!r.closedAt && isSameDay(r.closedAt, now);
}

export function isAppointmentToday(r: RequestSummary, now: Date = new Date()): boolean {
  return isAppointment(r) && !!r.confirmedDate && isSameDay(r.confirmedDate, now);
}

export function isUpcomingThisWeek(r: RequestSummary, now: Date = new Date()): boolean {
  if (!isAppointment(r) || !r.confirmedDate) return false;
  const at = new Date(r.confirmedDate).getTime();
  return at >= now.getTime() && at <= now.getTime() + 7 * DAY_MS;
}
