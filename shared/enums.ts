export const ROLES = ['admin', 'nagarsevak', 'nagaradhyaksh', 'officer', 'citizen', 'driver'] as const;
export type Role = (typeof ROLES)[number];

export const LANGUAGES = ['en', 'mr'] as const;
export type Language = (typeof LANGUAGES)[number];

export const REQUEST_TYPES = ['complaint', 'appointment'] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = [
  'REGISTERED',
  'VERIFIED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'SCHEDULED',
  'CLOSED',
  'REJECTED',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const ANNOUNCEMENT_CATEGORIES = [
  'general',
  'water_supply',
  'road_closure',
  'event',
  'tax_reminder',
  'scheme',
  'development_project',
  'infrastructure',
] as const;
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const EMERGENCY_CONTACT_CATEGORIES = [
  'police',
  'fire',
  'ambulance',
  'municipality',
  'water',
  'electricity',
] as const;
export type EmergencyContactCategory = (typeof EMERGENCY_CONTACT_CATEGORIES)[number];

export const KYC_STATUSES = ['pending', 'verified', 'rejected'] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

export const REQUEST_PRIORITIES = ['low', 'medium', 'high'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

// Legal status transitions per request type, used by core-service's request.service.ts
// to centrally validate every status change instead of scattering checks per resolver.
export const COMPLAINT_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  REGISTERED: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['CLOSED'],
  SCHEDULED: [],
  CLOSED: [],
  REJECTED: [],
};

export const APPOINTMENT_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  REGISTERED: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['ASSIGNED'],
  ASSIGNED: ['SCHEDULED'],
  SCHEDULED: ['CLOSED'],
  IN_PROGRESS: [],
  COMPLETED: [],
  CLOSED: [],
  REJECTED: [],
};
