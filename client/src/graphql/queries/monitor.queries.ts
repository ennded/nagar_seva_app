import { gql } from '@apollo/client';

export const WARD_REQUESTS = gql`
  query WardRequests($status: RequestStatus) {
    wardRequests(status: $status) {
      __typename
      ... on Complaint {
        id
        type
        status
        title
        createdAt
        citizen {
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
        purpose
        createdAt
        citizen {
          name
        }
        department {
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
          title
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
