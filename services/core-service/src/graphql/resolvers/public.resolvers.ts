import { CityModel } from '../../models/City.js';
import { WardModel } from '../../models/Ward.js';
import { DepartmentModel } from '../../models/Department.js';
import { UserModel } from '../../models/User.js';
import { AnnouncementModel } from '../../models/Announcement.js';
import { EmergencyContactModel } from '../../models/EmergencyContact.js';
import { ComplaintModel } from '../../models/Request.js';
import { mapCity, mapWard, mapDepartment, mapAnnouncement, mapEmergencyContact, categoryFromGQL } from '../serialize.js';
import { notFound } from '../../auth/authorize.js';

async function cityIdFromSlug(slug: string) {
  const city = await CityModel.findOne({ slug, isActive: true });
  if (!city) notFound(`No city found for slug "${slug}"`);
  return city;
}

export const publicResolvers = {
  Query: {
    cityBySlug: async (_: unknown, { slug }: { slug: string }) => {
      const city = await CityModel.findOne({ slug, isActive: true });
      return city ? mapCity(city) : null;
    },
    wardsByCity: async (_: unknown, { citySlug }: { citySlug: string }) => {
      const city = await cityIdFromSlug(citySlug);
      const wards = await WardModel.find({ city: city._id }).sort({ name: 1 }).populate('nagarsevak');
      return wards.map(mapWard);
    },
    departmentsByCity: async (_: unknown, { citySlug }: { citySlug: string }) => {
      const city = await cityIdFromSlug(citySlug);
      const departments = await DepartmentModel.find({ city: city._id }).sort({ name: 1 });
      return departments.map(mapDepartment);
    },
    publicDashboardStats: async (_: unknown, { citySlug }: { citySlug: string }) => {
      const city = await cityIdFromSlug(citySlug);
      const [totalCitizens, totalResolvedComplaints, totalWards] = await Promise.all([
        UserModel.countDocuments({ city: city._id, role: 'citizen', isActive: true }),
        ComplaintModel.countDocuments({ city: city._id, status: 'CLOSED' }),
        WardModel.countDocuments({ city: city._id }),
      ]);
      return { totalCitizens, totalResolvedComplaints, totalWards };
    },
    announcements: async (_: unknown, { citySlug, category }: { citySlug: string; category?: string }) => {
      const city = await cityIdFromSlug(citySlug);
      const filter: Record<string, unknown> = { city: city._id, status: 'published' };
      if (category) filter.category = categoryFromGQL(category);
      const docs = await AnnouncementModel.find(filter).sort({ publishedAt: -1 });
      return docs.map(mapAnnouncement);
    },
    emergencyContacts: async (_: unknown, { citySlug }: { citySlug: string }) => {
      const city = await cityIdFromSlug(citySlug);
      const docs = await EmergencyContactModel.find({ city: city._id }).sort({ order: 1 });
      return docs.map(mapEmergencyContact);
    },
  },
};
