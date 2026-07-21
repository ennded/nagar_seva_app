import { Types } from 'mongoose';
import { ComplaintModel, AppointmentModel, RequestModel, type RequestDoc } from '../models/Request.js';
import { UserModel, type User } from '../models/User.js';
import { WardModel } from '../models/Ward.js';
import { notify } from './notificationClient.js';
import { badInput, forbidden, notFound } from '../auth/authorize.js';
import {
  COMPLAINT_TRANSITIONS,
  APPOINTMENT_TRANSITIONS,
  type RequestStatus,
} from 'shared';

type ActorUser = User & { _id: Types.ObjectId };

function transitionsFor(type: string): Record<RequestStatus, RequestStatus[]> {
  return type === 'complaint' ? COMPLAINT_TRANSITIONS : APPOINTMENT_TRANSITIONS;
}

async function transitionStatus(
  request: RequestDoc & { save: () => Promise<any> },
  target: RequestStatus,
  actor: ActorUser,
  note?: string,
) {
  const allowed = transitionsFor(request.type)[request.status as RequestStatus] ?? [];
  if (!allowed.includes(target)) {
    badInput(`Cannot move a ${request.type} from ${request.status} to ${target}`);
  }
  request.status = target;
  request.statusHistory.push({ status: target, changedBy: actor._id, changedAt: new Date(), note });
  if (target === 'CLOSED') {
    request.closedAt = new Date();
  }
  await request.save();
  return request;
}

async function recipientsForNewRequest(cityId: Types.ObjectId, wardId: Types.ObjectId): Promise<string[]> {
  const [admins, nagarsevak, nagaradhyaksh] = await Promise.all([
    UserModel.find({ city: cityId, role: 'admin', isActive: true }).select('_id'),
    UserModel.findOne({ ward: wardId, role: 'nagarsevak', isActive: true }).select('_id'),
    UserModel.findOne({ city: cityId, role: 'nagaradhyaksh', isActive: true }).select('_id'),
  ]);
  const ids = admins.map((a) => String(a._id));
  if (nagarsevak) ids.push(String(nagarsevak._id));
  if (nagaradhyaksh) ids.push(String(nagaradhyaksh._id));
  return ids;
}

async function recipientsForCompletion(cityId: Types.ObjectId, wardId: Types.ObjectId, citizenId: Types.ObjectId): Promise<string[]> {
  const [nagarsevak, nagaradhyaksh] = await Promise.all([
    UserModel.findOne({ ward: wardId, role: 'nagarsevak', isActive: true }).select('_id'),
    UserModel.findOne({ city: cityId, role: 'nagaradhyaksh', isActive: true }).select('_id'),
  ]);
  const ids = [String(citizenId)];
  if (nagarsevak) ids.push(String(nagarsevak._id));
  if (nagaradhyaksh) ids.push(String(nagaradhyaksh._id));
  return ids;
}

export interface SubmitComplaintInput {
  title: string;
  category: string;
  description: string;
  address: string;
  photoUrls?: string[];
}

export async function submitComplaint(citizen: ActorUser, input: SubmitComplaintInput) {
  if (!citizen.ward) badInput('Citizen has no ward on file');
  const complaint = await ComplaintModel.create({
    type: 'complaint',
    city: citizen.city,
    citizen: citizen._id,
    ward: citizen.ward,
    title: input.title,
    category: input.category,
    description: input.description,
    address: input.address,
    photos: (input.photoUrls ?? []).map((url) => ({ url, uploadedAt: new Date() })),
    statusHistory: [{ status: 'REGISTERED', changedBy: citizen._id, changedAt: new Date() }],
  });
  const recipientIds = await recipientsForNewRequest(citizen.city as Types.ObjectId, citizen.ward as unknown as Types.ObjectId);
  await notify({
    recipientIds,
    type: 'new_request',
    message: `New complaint registered: ${input.title}`,
    requestId: String(complaint._id),
  });
  return complaint;
}

export interface SubmitAppointmentInput {
  departmentId: string;
  purpose: string;
  remarks?: string;
}

export async function submitAppointment(citizen: ActorUser, input: SubmitAppointmentInput) {
  if (!citizen.ward) badInput('Citizen has no ward on file');
  const appointment = await AppointmentModel.create({
    type: 'appointment',
    city: citizen.city,
    citizen: citizen._id,
    ward: citizen.ward,
    department: input.departmentId,
    purpose: input.purpose,
    remarks: input.remarks,
    statusHistory: [{ status: 'REGISTERED', changedBy: citizen._id, changedAt: new Date() }],
  });
  const recipientIds = await recipientsForNewRequest(citizen.city as Types.ObjectId, citizen.ward as unknown as Types.ObjectId);
  await notify({
    recipientIds,
    type: 'new_request',
    message: `New appointment requested: ${input.purpose}`,
    requestId: String(appointment._id),
  });
  return appointment;
}

async function loadCityScopedRequest(requestId: string, cityId: Types.ObjectId) {
  const request = await RequestModel.findOne({ _id: requestId, city: cityId });
  if (!request) notFound('Request not found');
  return request as unknown as RequestDoc & { save: () => Promise<any> };
}

export async function verifyRequest(admin: ActorUser, requestId: string, approve: boolean, note?: string) {
  const request = await loadCityScopedRequest(requestId, admin.city as Types.ObjectId);
  return transitionStatus(request, approve ? 'VERIFIED' : 'REJECTED', admin, note);
}

export async function assignRequest(
  admin: ActorUser,
  requestId: string,
  departmentId: string,
  officerId: string,
) {
  const request = await loadCityScopedRequest(requestId, admin.city as Types.ObjectId);
  const officer = await UserModel.findOne({ _id: officerId, city: admin.city, role: 'officer', department: departmentId });
  if (!officer) badInput('Officer not found in that department for this city');
  request.department = new Types.ObjectId(departmentId) as any;
  request.assignedOfficer = officer._id as any;
  return transitionStatus(request, 'ASSIGNED', admin);
}

export async function startWork(officer: ActorUser, requestId: string) {
  const request = await loadCityScopedRequest(requestId, officer.city as Types.ObjectId);
  if (String(request.assignedOfficer) !== String(officer._id)) forbidden('Not assigned to you');
  return transitionStatus(request, 'IN_PROGRESS', officer);
}

export async function completeComplaint(
  officer: ActorUser,
  requestId: string,
  resolutionProofUrls: string[],
  remarks?: string,
) {
  const request = (await loadCityScopedRequest(requestId, officer.city as Types.ObjectId)) as any;
  if (String(request.assignedOfficer) !== String(officer._id)) forbidden('Not assigned to you');
  request.resolutionProof = resolutionProofUrls.map((url) => ({ url, uploadedAt: new Date(), uploadedBy: officer._id }));
  request.resolutionRemarks = remarks;
  const updated = await transitionStatus(request, 'COMPLETED', officer);
  const recipientIds = await recipientsForCompletion(
    request.city as Types.ObjectId,
    request.ward as Types.ObjectId,
    request.citizen as Types.ObjectId,
  );
  await notify({
    recipientIds,
    type: 'request_completed',
    message: `Complaint completed: ${request.title}`,
    requestId: String(request._id),
  });
  return updated;
}

export async function scheduleAppointment(
  officer: ActorUser,
  requestId: string,
  confirmedDate: string,
  confirmedTimeSlot: string,
) {
  const request = (await loadCityScopedRequest(requestId, officer.city as Types.ObjectId)) as any;
  if (String(request.assignedOfficer) !== String(officer._id)) forbidden('Not assigned to you');
  request.confirmedDate = new Date(confirmedDate);
  request.confirmedTimeSlot = confirmedTimeSlot;
  const updated = await transitionStatus(request, 'SCHEDULED', officer);
  await notify({
    recipientIds: [String(request.citizen)],
    type: 'appointment_scheduled',
    message: `Your appointment is scheduled for ${confirmedDate} ${confirmedTimeSlot}`,
    requestId: String(request._id),
  });
  return updated;
}

export async function reviewAndClose(admin: ActorUser, requestId: string, note?: string) {
  const request = await loadCityScopedRequest(requestId, admin.city as Types.ObjectId);
  request.adminReviewNote = note;
  return transitionStatus(request, 'CLOSED', admin, note);
}
