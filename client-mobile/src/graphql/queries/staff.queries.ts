import { gql } from '@apollo/client';
import { REQUEST_UNION_FIELDS } from '../fragments';

// Officer: requests assigned to them.
export const MY_ASSIGNED_REQUESTS = gql`
  query MyAssignedRequests($status: RequestStatus) {
    myAssignedRequests(status: $status) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;

// Admin: requests awaiting review, and city-wide dashboard stats.
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
      byCategory {
        category
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
      byPriority {
        priority
        count
      }
    }
  }
`;

// Nagarsevak: requests within their ward.
export const WARD_REQUESTS = gql`
  query WardRequests($status: RequestStatus) {
    wardRequests(status: $status) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;

// Nagaradhyaksh: requests across the whole city.
export const MUNICIPALITY_REQUESTS = gql`
  query MunicipalityRequests($filter: RequestFilter, $page: Int, $limit: Int) {
    municipalityRequests(filter: $filter, page: $page, limit: $limit) {
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

// Nagaradhyaksh (any single request, no ownership scoping applied server-side for this role).
export const REQUEST_BY_ID = gql`
  query RequestById($id: ID!) {
    request(id: $id) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
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

export const WARD_PERFORMANCE = gql`
  query WardPerformance {
    wardPerformance {
      ward {
        id
        name
        code
      }
      totalComplaints
      pending
      resolutionRate
      avgResolutionDays
    }
  }
`;

// Admin: every request in the city, paginated.
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

// Admin: staff accounts (Officer/Nagarsevak/Nagaradhyaksh/Driver), optionally filtered by role.
export const STAFF_BY_CITY = gql`
  query StaffByCity($role: Role) {
    staffByCity(role: $role) {
      id
      name
      mobile
      role
      isActive
      ward {
        id
        name
      }
      department {
        id
        name
      }
    }
  }
`;

export const VEHICLES_BY_CITY = gql`
  query VehiclesByCity {
    vehiclesByCity {
      id
      registrationNumber
      onDuty
      locationUpdatedAt
      currentLat
      currentLng
      ward {
        id
        name
      }
      driver {
        id
        name
      }
    }
  }
`;
