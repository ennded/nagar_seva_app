// GraphQL enums are UPPER_SNAKE by convention; the DB stores the shared/enums.ts values
// (lowercase for role/type, snake_case for category, already-uppercase for RequestStatus).
// These helpers are the single place that translation happens.

export const roleToGQL = (role: string) => role.toUpperCase();
export const roleFromGQL = (role: string) => role.toLowerCase();

export const requestTypeToGQL = (type: string) => type.toUpperCase();

export const categoryToGQL = (category: string) => category.toUpperCase();
export const categoryFromGQL = (category: string) => category.toLowerCase();

export function mapUser(doc: any): Record<string, any> | null {
  if (!doc) return null;
  // doc can be an un-populated ObjectId if a resolver's .populate() chain missed this path;
  // fail soft to null (GraphQL then reports a clear non-null-field error) instead of crashing.
  if (typeof doc !== 'object' || !doc.role) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    mobile: doc.mobile,
    email: doc.email ?? null,
    role: roleToGQL(doc.role),
    // ward/department can be un-populated ObjectIds if a resolver's .populate() chain missed
    // this path; Ward.name/Department.name are non-null in the schema, so a bare {id} object
    // would crash the whole response — fail soft to null instead (the caller should fix the
    // populate() chain, but a temporarily-missing ward/department beats a hard GraphQL error).
    ward: doc.ward && typeof doc.ward === 'object' && doc.ward.name ? mapWard(doc.ward) : null,
    department:
      doc.department && typeof doc.department === 'object' && doc.department.name
        ? mapDepartment(doc.department)
        : null,
    kycStatus: doc.kycStatus ? doc.kycStatus.toUpperCase() : null,
    isActive: doc.isActive,
    language: (doc.language ?? 'en').toUpperCase(),
    availability: (doc.availability ?? []).map((a: any) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })),
  };
}

export function mapWard(doc: any): Record<string, any> | null {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    code: doc.code,
    nagarsevak:
      doc.nagarsevak && typeof doc.nagarsevak === 'object' && doc.nagarsevak.name ? mapUser(doc.nagarsevak) : null,
  };
}

export function mapDepartment(doc: any) {
  if (!doc) return null;
  return { id: String(doc._id), name: doc.name, description: doc.description ?? null };
}

export function mapCity(doc: any) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    logoUrl: doc.logoUrl ?? null,
    address: doc.address ?? null,
    contactPhone: doc.contactPhone ?? null,
    contactEmail: doc.contactEmail ?? null,
    aboutText: doc.aboutText ?? null,
  };
}

export function mapRequest(doc: any) {
  const base = {
    id: String(doc._id),
    type: requestTypeToGQL(doc.type),
    citizen: mapUser(doc.citizen),
    ward: mapWard(doc.ward),
    department: mapDepartment(doc.department),
    assignedOfficer: mapUser(doc.assignedOfficer),
    status: doc.status,
    priority: (doc.priority ?? 'medium').toUpperCase(),
    statusHistory: (doc.statusHistory ?? []).map((event: any) => ({
      status: event.status,
      changedBy: mapUser(event.changedBy),
      changedAt: new Date(event.changedAt).toISOString(),
      note: event.note ?? null,
    })),
    adminReviewNote: doc.adminReviewNote ?? null,
    createdAt: new Date(doc.createdAt).toISOString(),
    closedAt: doc.closedAt ? new Date(doc.closedAt).toISOString() : null,
  };
  if (doc.type === 'complaint') {
    return {
      ...base,
      __typename: 'Complaint',
      title: doc.title,
      category: doc.category,
      description: doc.description,
      address: doc.address,
      photos: (doc.photos ?? []).map((p: any) => ({ url: p.url, uploadedAt: new Date(p.uploadedAt).toISOString() })),
      resolutionProof: (doc.resolutionProof ?? []).map((p: any) => ({
        url: p.url,
        uploadedAt: new Date(p.uploadedAt).toISOString(),
        uploadedBy: mapUser(p.uploadedBy),
      })),
      resolutionRemarks: doc.resolutionRemarks ?? null,
    };
  }
  return {
    ...base,
    __typename: 'Appointment',
    purpose: doc.purpose,
    remarks: doc.remarks ?? null,
    confirmedDate: doc.confirmedDate ? new Date(doc.confirmedDate).toISOString() : null,
    confirmedTimeSlot: doc.confirmedTimeSlot ?? null,
  };
}

export function mapAnnouncement(doc: any) {
  return {
    id: String(doc._id),
    title: doc.title,
    body: doc.body,
    category: categoryToGQL(doc.category),
    status: doc.status,
    ward: doc.ward && typeof doc.ward === 'object' && doc.ward.name ? mapWard(doc.ward) : null,
    isEmergency: doc.isEmergency ?? false,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export function mapVehicle(doc: any) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    registrationNumber: doc.registrationNumber,
    ward: mapWard(doc.ward),
    driver: mapUser(doc.driver),
    onDuty: doc.onDuty,
    currentLat: doc.currentLat ?? null,
    currentLng: doc.currentLng ?? null,
    locationUpdatedAt: doc.locationUpdatedAt ? new Date(doc.locationUpdatedAt).toISOString() : null,
  };
}

export function mapEmergencyContact(doc: any) {
  return {
    id: String(doc._id),
    name: doc.name,
    category: categoryToGQL(doc.category),
    phoneNumber: doc.phoneNumber,
    order: doc.order,
  };
}
