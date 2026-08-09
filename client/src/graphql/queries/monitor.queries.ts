import { gql } from '@apollo/client';

export const WARD_REQUESTS = gql`
  query WardRequests($status: RequestStatus) {
    wardRequests(status: $status) {
      __typename
      ... on Complaint {
        id
        type
        status
        priority
        title
        category
        address
        createdAt
        closedAt
        citizen {
          name
        }
        department {
          name
        }
        assignedOfficer {
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
        closedAt
        confirmedDate
        confirmedTimeSlot
        citizen {
          name
        }
        department {
          name
        }
        assignedOfficer {
          name
        }
      }
    }
  }
`;

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
