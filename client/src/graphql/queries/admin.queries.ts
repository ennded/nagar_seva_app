import { gql } from '@apollo/client';
import { USER_FIELDS } from '../fragments';

export const DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboardStats {
      totalRequests
      totalComplaints
      openComplaints
      resolvedToday
      resolutionRate
      pendingAppointments
      completedAppointments
      byStatus {
        status
        count
      }
      byDepartment {
        department {
          id
          name
        }
        count
      }
      byWard {
        ward {
          id
          name
        }
        count
      }
      byCategory {
        category
        count
      }
      byPriority {
        priority
        count
      }
    }
  }
`;

export const WARD_PERFORMANCE = gql`
  query WardPerformance {
    wardPerformance {
      ward {
        id
        name
      }
      totalComplaints
      pending
      resolutionRate
      avgResolutionDays
    }
  }
`;

export const STAFF_BY_CITY = gql`
  query StaffByCity($role: Role) {
    staffByCity(role: $role) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const USERS_BY_CITY = gql`
  query UsersByCity($role: Role) {
    usersByCity(role: $role) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const DEPARTMENT_PERFORMANCE = gql`
  query DepartmentPerformance {
    departmentPerformance {
      department {
        id
        name
      }
      totalRequests
      resolvedRequests
      resolutionRate
      avgResolutionDays
    }
  }
`;

export const OFFICERS_BY_DEPARTMENT = gql`
  query OfficersByDepartment($departmentId: ID!) {
    officersByDepartment(departmentId: $departmentId) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const ALL_REQUESTS = gql`
  query AllRequests($filter: RequestFilter, $page: Int, $limit: Int) {
    allRequests(filter: $filter, page: $page, limit: $limit) {
      total
      page
      limit
      items {
        __typename
        ... on Complaint {
          id
          type
          status
          priority
          title
          category
          createdAt
          citizen {
            name
          }
          ward {
            name
          }
          department {
            name
          }
        }
        ... on Appointment {
          id
          type
          status
          priority
          purpose
          createdAt
          citizen {
            name
          }
          ward {
            name
          }
          department {
            name
          }
        }
      }
    }
  }
`;

export const PENDING_REQUESTS = gql`
  query PendingRequests {
    pendingRequests {
      __typename
      ... on Complaint {
        id
        type
        status
        priority
        title
        category
        createdAt
        citizen {
          name
        }
        ward {
          name
        }
      }
      ... on Appointment {
        id
        type
        status
        priority
        purpose
        createdAt
        citizen {
          name
        }
        ward {
          name
        }
      }
    }
  }
`;

export const ANNOUNCEMENTS_ADMIN = gql`
  query AnnouncementsAdmin {
    announcementsAdmin {
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

export const WARD_ANNOUNCEMENTS = gql`
  query WardAnnouncements {
    wardAnnouncements {
      id
      title
      body
      category
      status
      publishedAt
      createdAt
    }
  }
`;
