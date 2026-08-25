import { gql } from '@apollo/client';

export const CITIES = gql`
  query Cities {
    cities {
      id
      name
      slug
      address
    }
  }
`;

export const PUBLIC_DASHBOARD_STATS = gql`
  query PublicDashboardStats($citySlug: String!) {
    publicDashboardStats(citySlug: $citySlug) {
      totalCitizens
      totalResolvedComplaints
      totalWards
    }
  }
`;

export const CITY_BY_SLUG = gql`
  query CityBySlug($slug: String!) {
    cityBySlug(slug: $slug) {
      id
      name
      slug
      logoUrl
      address
      contactPhone
      contactEmail
      aboutText
    }
  }
`;

export const WARDS_BY_CITY = gql`
  query WardsByCity($citySlug: String!) {
    wardsByCity(citySlug: $citySlug) {
      id
      name
      code
      nagarsevak {
        id
        name
      }
    }
  }
`;

export const DEPARTMENTS_BY_CITY = gql`
  query DepartmentsByCity($citySlug: String!) {
    departmentsByCity(citySlug: $citySlug) {
      id
      name
      description
    }
  }
`;

export const ANNOUNCEMENTS = gql`
  query Announcements($citySlug: String!, $category: AnnouncementCategory) {
    announcements(citySlug: $citySlug, category: $category) {
      id
      title
      body
      category
      status
      isEmergency
      publishedAt
      createdAt
    }
  }
`;

export const EMERGENCY_CONTACTS = gql`
  query EmergencyContacts($citySlug: String!) {
    emergencyContacts(citySlug: $citySlug) {
      id
      name
      category
      phoneNumber
      order
    }
  }
`;
