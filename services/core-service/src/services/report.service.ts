import { Types } from 'mongoose';
import { RequestModel } from '../models/Request.js';
import { DepartmentModel } from '../models/Department.js';
import { WardModel } from '../models/Ward.js';
import { UserModel } from '../models/User.js';

export interface ReportData {
  title: string;
  description: string;
  columns: string[];
  rows: (string | number)[][];
}

export const REPORT_TYPES = [
  'monthly-complaints',
  'department-performance',
  'ward-performance',
  'resolution-time',
  'appointment-statistics',
  'officer-performance',
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

const HOUR_MS = 3600000;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

async function monthlyComplaints(city: Types.ObjectId): Promise<ReportData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [createdRaw, resolvedRaw] = await Promise.all([
    RequestModel.aggregate([
      { $match: { city, type: 'complaint', createdAt: { $gte: monthStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    RequestModel.aggregate([
      { $match: { city, type: 'complaint', status: 'CLOSED', closedAt: { $gte: monthStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$closedAt' } }, count: { $sum: 1 } } },
    ]),
  ]);

  const byDate = new Map<string, { created: number; resolved: number }>();
  for (const r of createdRaw) byDate.set(r._id, { created: r.count, resolved: byDate.get(r._id)?.resolved ?? 0 });
  for (const r of resolvedRaw) byDate.set(r._id, { created: byDate.get(r._id)?.created ?? 0, resolved: r.count });

  const rows = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => [date, v.created, v.resolved]);

  return {
    title: 'Monthly Complaints Report',
    description: 'Complaint volume and resolution trends for the month',
    columns: ['Date', 'New Complaints', 'Resolved Complaints'],
    rows,
  };
}

async function departmentPerformance(city: Types.ObjectId, ward?: Types.ObjectId): Promise<ReportData> {
  const matchFilter: Record<string, unknown> = { city, department: { $ne: null } };
  if (ward) matchFilter.ward = ward;
  const raw = await RequestModel.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$department',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
        avgTurnaroundMs: {
          $avg: { $cond: [{ $eq: ['$status', 'CLOSED'] }, { $subtract: ['$closedAt', '$createdAt'] }, null] },
        },
      },
    },
  ]);
  const departments = await DepartmentModel.find({ _id: { $in: raw.map((d) => d._id) } });

  const rows = raw
    .map((d) => {
      const dept = departments.find((dp) => String(dp._id) === String(d._id));
      const rate = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
      const avgHrs = d.avgTurnaroundMs ? round1(d.avgTurnaroundMs / HOUR_MS) : '—';
      return [dept?.name ?? 'Unknown', d.total, d.resolved, `${rate}%`, avgHrs];
    })
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  return {
    title: 'Department Performance Report',
    description: 'Resolution rate and turnaround by department',
    columns: ['Department', 'Total Requests', 'Resolved', 'Resolution Rate', 'Avg Turnaround (hrs)'],
    rows,
  };
}

async function wardPerformance(city: Types.ObjectId): Promise<ReportData> {
  const raw = await RequestModel.aggregate([
    { $match: { city, type: 'complaint' } },
    {
      $group: {
        _id: '$ward',
        total: { $sum: 1 },
        avgResponseMs: {
          $avg: { $cond: [{ $eq: ['$status', 'CLOSED'] }, { $subtract: ['$closedAt', '$createdAt'] }, null] },
        },
      },
    },
  ]);
  const wards = await WardModel.find({ _id: { $in: raw.map((w) => w._id) } });

  const rows = raw
    .map((w) => {
      const ward = wards.find((wd) => String(wd._id) === String(w._id));
      const avgHrs = w.avgResponseMs ? round1(w.avgResponseMs / HOUR_MS) : '—';
      return [ward?.name ?? 'Unknown', w.total, avgHrs];
    })
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  return {
    title: 'Ward Performance Report',
    description: 'Complaint density and response time by ward',
    columns: ['Ward', 'Total Complaints', 'Avg Response Time (hrs)'],
    rows,
  };
}

async function resolutionTime(city: Types.ObjectId): Promise<ReportData> {
  const raw = await RequestModel.aggregate([
    { $match: { city, type: 'complaint', status: 'CLOSED', closedAt: { $ne: null } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgMs: { $avg: { $subtract: ['$closedAt', '$createdAt'] } },
      },
    },
  ]);

  const rows = raw
    .map((c) => [c._id ?? 'Uncategorized', c.count, round1(c.avgMs / HOUR_MS)])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  return {
    title: 'Resolution Time Report',
    description: 'Average time to resolve by category',
    columns: ['Category', 'Resolved Complaints', 'Avg Resolution Time (hrs)'],
    rows,
  };
}

async function appointmentStatistics(city: Types.ObjectId): Promise<ReportData> {
  const raw = await RequestModel.aggregate([
    { $match: { city, type: 'appointment', department: { $ne: null } } },
    {
      $group: {
        _id: '$department',
        total: { $sum: 1 },
        approved: { $sum: { $cond: [{ $in: ['$status', ['ASSIGNED', 'SCHEDULED', 'CLOSED']] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
      },
    },
  ]);
  const departments = await DepartmentModel.find({ _id: { $in: raw.map((d) => d._id) } });

  const rows = raw
    .map((d) => {
      const dept = departments.find((dp) => String(dp._id) === String(d._id));
      const approvalRate = d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0;
      const completionRate = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
      return [dept?.name ?? 'Unknown', d.total, d.approved, `${approvalRate}%`, d.completed, `${completionRate}%`];
    })
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  return {
    title: 'Appointment Statistics Report',
    description: 'Appointment volume, approval and completion rates',
    columns: ['Department', 'Total Appointments', 'Approved', 'Approval Rate', 'Completed', 'Completion Rate'],
    rows,
  };
}

async function officerPerformance(city: Types.ObjectId): Promise<ReportData> {
  const raw = await RequestModel.aggregate([
    { $match: { city, assignedOfficer: { $ne: null } } },
    {
      $group: {
        _id: '$assignedOfficer',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
      },
    },
  ]);
  const officers = await UserModel.find({ _id: { $in: raw.map((o) => o._id) } }).populate('department');

  const rows = raw
    .map((o) => {
      const officer = officers.find((of) => String(of._id) === String(o._id));
      const rate = o.total > 0 ? Math.round((o.resolved / o.total) * 100) : 0;
      return [officer?.name ?? 'Unknown', (officer as any)?.department?.name ?? '—', o.total, o.resolved, `${rate}%`];
    })
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  return {
    title: 'Officer Performance Report',
    description: 'Workload and resolution rate per officer',
    columns: ['Officer', 'Department', 'Total Assigned', 'Resolved', 'Resolution Rate'],
    rows,
  };
}

export async function buildReport(type: ReportType, city: Types.ObjectId, ward?: Types.ObjectId): Promise<ReportData> {
  switch (type) {
    case 'monthly-complaints':
      return monthlyComplaints(city);
    case 'department-performance':
      return departmentPerformance(city, ward);
    case 'ward-performance':
      return wardPerformance(city);
    case 'resolution-time':
      return resolutionTime(city);
    case 'appointment-statistics':
      return appointmentStatistics(city);
    case 'officer-performance':
      return officerPerformance(city);
  }
}
