import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../test/dbSetup.js';
import { CityModel } from '../models/City.js';
import { WardModel } from '../models/Ward.js';
import { DepartmentModel } from '../models/Department.js';
import { UserModel, type User } from '../models/User.js';
import * as requestService from './request.service.js';

vi.mock('./notificationClient.js', () => ({ notify: vi.fn().mockResolvedValue(undefined) }));

type ActorUser = User & { _id: Types.ObjectId };

describe('request.service', () => {
  let cityId: Types.ObjectId;
  let wardId: Types.ObjectId;
  let departmentId: Types.ObjectId;
  let citizen: ActorUser;
  let admin: ActorUser;
  let officer: ActorUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    const city = await CityModel.create({ name: 'Test City', slug: 'testcity' });
    const ward = await WardModel.create({ city: city._id, name: 'Ward A', code: 'WA' });
    const department = await DepartmentModel.create({ city: city._id, name: 'Sanitation' });
    cityId = city._id;
    wardId = ward._id;
    departmentId = department._id;

    citizen = (await UserModel.create({
      name: 'Citizen One',
      mobile: '9000000001',
      role: 'citizen',
      city: cityId,
      ward: wardId,
    })) as unknown as ActorUser;
    admin = (await UserModel.create({
      name: 'Admin One',
      mobile: '9000000002',
      role: 'admin',
      city: cityId,
    })) as unknown as ActorUser;
    officer = (await UserModel.create({
      name: 'Officer One',
      mobile: '9000000003',
      role: 'officer',
      city: cityId,
      department: departmentId,
    })) as unknown as ActorUser;
  });

  async function submitTestComplaint() {
    return requestService.submitComplaint(citizen, {
      title: 'Pothole on Main Rd',
      category: 'roads',
      description: 'Large pothole causing traffic',
      address: '123 Main Rd',
    });
  }

  it('submitComplaint creates a REGISTERED complaint with a status history entry', async () => {
    const doc = await submitTestComplaint();
    expect(doc.status).toBe('REGISTERED');
    expect(doc.statusHistory).toHaveLength(1);
    expect(doc.statusHistory[0].status).toBe('REGISTERED');
    expect(String(doc.citizen)).toBe(String(citizen._id));
    expect(String(doc.ward)).toBe(String(wardId));
  });

  it('submitComplaint rejects a citizen with no ward on file', async () => {
    const wardlessCitizen = { _id: citizen._id, city: cityId, ward: undefined } as unknown as ActorUser;
    await expect(
      requestService.submitComplaint(wardlessCitizen, {
        title: 'x',
        category: 'roads',
        description: 'x',
        address: 'x',
      }),
    ).rejects.toThrow(/ward/i);
  });

  it('runs the full complaint lifecycle: verify -> assign -> start -> complete -> close', async () => {
    const complaint = await submitTestComplaint();
    const id = String(complaint._id);

    const verified = await requestService.verifyRequest(admin, id, true);
    expect(verified.status).toBe('VERIFIED');

    const assigned = await requestService.assignRequest(admin, id, String(departmentId), String(officer._id));
    expect(assigned.status).toBe('ASSIGNED');
    expect(String((assigned as any).assignedOfficer)).toBe(String(officer._id));

    const started = await requestService.startWork(officer, id);
    expect(started.status).toBe('IN_PROGRESS');

    const completed = await requestService.completeComplaint(officer, id, ['http://example.com/proof.jpg'], 'Fixed it');
    expect(completed.status).toBe('COMPLETED');
    expect((completed as any).resolutionRemarks).toBe('Fixed it');
    expect((completed as any).resolutionProof).toHaveLength(1);

    const closed = await requestService.reviewAndClose(admin, id, 'Confirmed resolved');
    expect(closed.status).toBe('CLOSED');
    expect(closed.closedAt).toBeTruthy();
    // REGISTERED (on creation) + VERIFIED + ASSIGNED + IN_PROGRESS + COMPLETED + CLOSED
    expect(closed.statusHistory).toHaveLength(6);
  });

  it('rejecting a request sets status to REJECTED and stops the workflow', async () => {
    const complaint = await submitTestComplaint();
    const rejected = await requestService.verifyRequest(admin, String(complaint._id), false);
    expect(rejected.status).toBe('REJECTED');
  });

  it('rejects an out-of-order transition (closing a REGISTERED request)', async () => {
    const complaint = await submitTestComplaint();
    await expect(requestService.reviewAndClose(admin, String(complaint._id), undefined)).rejects.toThrow(
      /cannot move/i,
    );
  });

  it('assignRequest rejects an officer from a different department', async () => {
    const otherDepartment = await DepartmentModel.create({ city: cityId, name: 'Water' });
    const complaint = await submitTestComplaint();
    await requestService.verifyRequest(admin, String(complaint._id), true);
    await expect(
      requestService.assignRequest(admin, String(complaint._id), String(otherDepartment._id), String(officer._id)),
    ).rejects.toThrow(/officer not found/i);
  });

  it('startWork rejects an officer the request was not assigned to', async () => {
    const otherOfficer = (await UserModel.create({
      name: 'Officer Two',
      mobile: '9000000004',
      role: 'officer',
      city: cityId,
      department: departmentId,
    })) as unknown as ActorUser;

    const complaint = await submitTestComplaint();
    await requestService.verifyRequest(admin, String(complaint._id), true);
    await requestService.assignRequest(admin, String(complaint._id), String(departmentId), String(officer._id));

    await expect(requestService.startWork(otherOfficer, String(complaint._id))).rejects.toThrow(/not assigned/i);
  });

  it('runs the full appointment lifecycle: verify -> assign -> schedule -> close', async () => {
    const appointment = await requestService.submitAppointment(citizen, {
      departmentId: String(departmentId),
      purpose: 'Property tax query',
    });
    const id = String(appointment._id);

    await requestService.verifyRequest(admin, id, true);
    const assigned = await requestService.assignRequest(admin, id, String(departmentId), String(officer._id));
    expect(assigned.status).toBe('ASSIGNED');

    const scheduled = await requestService.scheduleAppointment(officer, id, '2026-08-01', '10:00 AM - 12:00 PM');
    expect(scheduled.status).toBe('SCHEDULED');
    expect((scheduled as any).confirmedTimeSlot).toBe('10:00 AM - 12:00 PM');

    const closed = await requestService.reviewAndClose(admin, id, undefined);
    expect(closed.status).toBe('CLOSED');
  });
});
