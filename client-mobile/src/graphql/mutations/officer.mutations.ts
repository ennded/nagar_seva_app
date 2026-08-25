import { gql } from '@apollo/client';

export const START_WORK = gql`
  mutation StartWork($id: ID!) {
    startWork(id: $id) {
      __typename
      ... on Complaint {
        id
        status
      }
      ... on Appointment {
        id
        status
      }
    }
  }
`;

export const COMPLETE_COMPLAINT = gql`
  mutation CompleteComplaint($id: ID!, $resolutionProofUrls: [String!]!, $remarks: String) {
    completeComplaint(id: $id, resolutionProofUrls: $resolutionProofUrls, remarks: $remarks) {
      id
      status
    }
  }
`;
