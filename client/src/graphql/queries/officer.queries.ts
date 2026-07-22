import { gql } from '@apollo/client';

export const MY_ASSIGNED_REQUESTS = gql`
  query MyAssignedRequests($status: RequestStatus) {
    myAssignedRequests(status: $status) {
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
      }
    }
  }
`;
