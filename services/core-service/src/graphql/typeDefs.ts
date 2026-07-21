import { gql } from 'graphql-tag';

export const typeDefs = gql`
  enum Role {
    ADMIN
    NAGARSEVAK
    NAGARADHYAKSH
    OFFICER
    CITIZEN
    DRIVER
  }

  enum RequestType {
    COMPLAINT
    APPOINTMENT
  }

  enum RequestStatus {
    REGISTERED
    VERIFIED
    ASSIGNED
    IN_PROGRESS
    COMPLETED
    SCHEDULED
    CLOSED
    REJECTED
  }

  enum AnnouncementCategory {
    GENERAL
    WATER_SUPPLY
    ROAD_CLOSURE
    EVENT
    TAX_REMINDER
    SCHEME
    DEVELOPMENT_PROJECT
    INFRASTRUCTURE
  }

  enum EmergencyContactCategory {
    POLICE
    FIRE
    AMBULANCE
    MUNICIPALITY
    WATER
    ELECTRICITY
  }

  enum KycStatus {
    PENDING
    VERIFIED
    REJECTED
  }

  type City {
    id: ID!
    name: String!
    slug: String!
    logoUrl: String
    address: String
    contactPhone: String
    contactEmail: String
    aboutText: String
  }

  type Ward {
    id: ID!
    name: String!
    code: String!
    nagarsevak: User
  }

  type Department {
    id: ID!
    name: String!
    description: String
  }

  type User {
    id: ID!
    name: String!
    mobile: String!
    email: String
    role: Role!
    ward: Ward
    department: Department
    kycStatus: KycStatus
    isActive: Boolean!
  }

  type Photo {
    url: String!
    uploadedAt: String!
  }

  type ResolutionProof {
    url: String!
    uploadedAt: String!
    uploadedBy: User
  }

  type StatusEvent {
    status: RequestStatus!
    changedBy: User
    changedAt: String!
    note: String
  }

  interface RequestBase {
    id: ID!
    type: RequestType!
    citizen: User!
    ward: Ward!
    department: Department
    assignedOfficer: User
    status: RequestStatus!
    statusHistory: [StatusEvent!]!
    adminReviewNote: String
    createdAt: String!
    closedAt: String
  }

  type Complaint implements RequestBase {
    id: ID!
    type: RequestType!
    citizen: User!
    ward: Ward!
    department: Department
    assignedOfficer: User
    status: RequestStatus!
    statusHistory: [StatusEvent!]!
    adminReviewNote: String
    createdAt: String!
    closedAt: String
    title: String!
    category: String!
    description: String!
    address: String!
    photos: [Photo!]!
    resolutionProof: [ResolutionProof!]!
    resolutionRemarks: String
  }

  type Appointment implements RequestBase {
    id: ID!
    type: RequestType!
    citizen: User!
    ward: Ward!
    department: Department
    assignedOfficer: User
    status: RequestStatus!
    statusHistory: [StatusEvent!]!
    adminReviewNote: String
    createdAt: String!
    closedAt: String
    purpose: String!
    remarks: String
    confirmedDate: String
    confirmedTimeSlot: String
  }

  union RequestUnion = Complaint | Appointment

  type RequestPage {
    items: [RequestUnion!]!
    total: Int!
    page: Int!
    limit: Int!
  }

  type StatusCount {
    status: RequestStatus!
    count: Int!
  }

  type DepartmentCount {
    department: Department!
    count: Int!
  }

  type WardCount {
    ward: Ward!
    count: Int!
  }

  type DashboardStats {
    totalRequests: Int!
    byStatus: [StatusCount!]!
    byDepartment: [DepartmentCount!]!
    byWard: [WardCount!]!
  }

  type PublicDashboardStats {
    totalCitizens: Int!
    totalResolvedComplaints: Int!
    totalWards: Int!
  }

  type Announcement {
    id: ID!
    title: String!
    body: String!
    category: AnnouncementCategory!
    status: String!
    publishedAt: String
    createdAt: String!
  }

  type EmergencyContact {
    id: ID!
    name: String!
    category: EmergencyContactCategory!
    phoneNumber: String!
    order: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
    citySlug: String!
  }

  input RegisterCitizenInput {
    citySlug: String!
    name: String!
    mobile: String!
    email: String!
    password: String!
    wardId: ID!
    aadharDocUrl: String
    voterIdDocUrl: String
  }

  input CreateStaffUserInput {
    name: String!
    mobile: String!
    role: Role!
    wardId: ID
    departmentId: ID
  }

  input SubmitComplaintInput {
    title: String!
    category: String!
    description: String!
    address: String!
    photoUrls: [String!]
  }

  input SubmitAppointmentInput {
    departmentId: ID!
    purpose: String!
    remarks: String
  }

  input RequestFilter {
    type: RequestType
    status: RequestStatus
    wardId: ID
    departmentId: ID
  }

  input CreateAnnouncementInput {
    title: String!
    body: String!
    category: AnnouncementCategory
  }

  input CreateEmergencyContactInput {
    name: String!
    category: EmergencyContactCategory!
    phoneNumber: String!
    order: Int
  }

  type Query {
    cityBySlug(slug: String!): City
    wardsByCity(citySlug: String!): [Ward!]!
    departmentsByCity(citySlug: String!): [Department!]!
    publicDashboardStats(citySlug: String!): PublicDashboardStats!
    announcements(citySlug: String!, category: AnnouncementCategory): [Announcement!]!
    emergencyContacts(citySlug: String!): [EmergencyContact!]!

    me: User

    officersByDepartment(departmentId: ID!): [User!]!

    myRequests(status: RequestStatus): [RequestUnion!]!
    request(id: ID!): RequestUnion

    pendingRequests: [RequestUnion!]!
    allRequests(filter: RequestFilter, page: Int, limit: Int): RequestPage!

    myAssignedRequests(status: RequestStatus): [RequestUnion!]!

    wardRequests(status: RequestStatus): [RequestUnion!]!

    municipalityRequests(filter: RequestFilter, page: Int, limit: Int): RequestPage!
    dashboardStats: DashboardStats!
  }

  type Mutation {
    registerCitizen(input: RegisterCitizenInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    requestOtp(mobile: String!): Boolean!
    verifyOtp(mobile: String!, code: String!): AuthPayload!

    createWard(name: String!, code: String!): Ward!
    createDepartment(name: String!, description: String): Department!
    createStaffUser(input: CreateStaffUserInput!): User!

    submitComplaint(input: SubmitComplaintInput!): Complaint!
    submitAppointment(input: SubmitAppointmentInput!): Appointment!

    verifyRequest(id: ID!, approve: Boolean!, note: String): RequestUnion!
    assignRequest(id: ID!, departmentId: ID!, officerId: ID!): RequestUnion!
    reviewAndClose(id: ID!, note: String): RequestUnion!

    startWork(id: ID!): RequestUnion!
    completeComplaint(id: ID!, resolutionProofUrls: [String!]!, remarks: String): Complaint!
    scheduleAppointment(id: ID!, confirmedDate: String!, confirmedTimeSlot: String!): Appointment!

    createAnnouncement(input: CreateAnnouncementInput!): Announcement!
    publishAnnouncement(id: ID!): Announcement!

    createEmergencyContact(input: CreateEmergencyContactInput!): EmergencyContact!
    updateEmergencyContact(id: ID!, input: CreateEmergencyContactInput!): EmergencyContact!
    deleteEmergencyContact(id: ID!): Boolean!
  }
`;
