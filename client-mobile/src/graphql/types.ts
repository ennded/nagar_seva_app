export type Role = 'ADMIN' | 'NAGARSEVAK' | 'NAGARADHYAKSH' | 'OFFICER' | 'CITIZEN' | 'DRIVER';
export type RequestStatus =
  | 'REGISTERED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SCHEDULED'
  | 'CLOSED'
  | 'REJECTED';
export type RequestType = 'COMPLAINT' | 'APPOINTMENT';
export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface WardRef {
  id: string;
  name: string;
  code: string;
  nagarsevak?: { id: string; name: string } | null;
}

export interface DepartmentRef {
  id: string;
  name: string;
  description?: string | null;
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UserFields {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  role: Role;
  kycStatus: string | null;
  isActive: boolean;
  ward: WardRef | null;
  department: DepartmentRef | null;
  availability: AvailabilitySlot[];
}

export interface StatusEvent {
  status: RequestStatus;
  changedAt: string;
  note: string | null;
  changedBy: UserFields | null;
}

interface RequestBaseFields {
  id: string;
  type: RequestType;
  status: RequestStatus;
  priority: RequestPriority;
  adminReviewNote: string | null;
  createdAt: string;
  closedAt: string | null;
  citizen: UserFields;
  ward: WardRef;
  department: DepartmentRef | null;
  assignedOfficer: UserFields | null;
  statusHistory: StatusEvent[];
}

export interface Photo {
  url: string;
  uploadedAt: string;
}

export interface ResolutionProof extends Photo {
  uploadedBy: UserFields | null;
}

export interface Complaint extends RequestBaseFields {
  __typename: 'Complaint';
  title: string;
  category: string;
  description: string;
  address: string;
  photos: Photo[];
  resolutionProof: ResolutionProof[];
  resolutionRemarks: string | null;
}

export interface Appointment extends RequestBaseFields {
  __typename: 'Appointment';
  purpose: string;
  remarks: string | null;
  confirmedDate: string | null;
  confirmedTimeSlot: string | null;
}

export type RequestUnion = Complaint | Appointment;

export interface City {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  aboutText: string | null;
}

export interface PublicDashboardStats {
  totalCitizens: number;
  totalResolvedComplaints: number;
  totalWards: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
  isEmergency: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  requestId: string | null;
  announcementId: string | null;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  category: string;
  phoneNumber: string;
  order: number;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  ward: WardRef;
  driver: UserFields | null;
  onDuty: boolean;
  currentLat: number | null;
  currentLng: number | null;
  locationUpdatedAt: string | null;
}

export interface AuthPayload {
  token: string;
  citySlug: string;
  user: UserFields;
}

export interface RequestSummary {
  __typename: 'Complaint' | 'Appointment';
  id: string;
  type: RequestType;
  status: RequestStatus;
  priority: RequestPriority;
  title?: string;
  category?: string;
  address?: string;
  purpose?: string;
  createdAt: string;
  closedAt?: string | null;
  confirmedDate?: string | null;
  confirmedTimeSlot?: string | null;
  citizen: { name: string };
  ward: { name: string };
  department?: { name: string } | null;
  assignedOfficer?: { name: string } | null;
}

export interface DashboardStats {
  totalRequests: number;
  totalComplaints: number;
  openComplaints: number;
  resolvedToday: number;
  resolutionRate: number;
  pendingAppointments: number;
  completedAppointments: number;
  byStatus: { status: RequestStatus; count: number }[];
  byCategory: { category: string; count: number }[];
}

export interface DepartmentPerformance {
  department: { id: string; name: string };
  totalRequests: number;
  resolvedRequests: number;
  resolutionRate: number;
  avgResolutionDays: number | null;
}

export interface WardPerformance {
  ward: WardRef;
  totalComplaints: number;
  pending: number;
  resolutionRate: number;
  avgResolutionDays: number | null;
}
