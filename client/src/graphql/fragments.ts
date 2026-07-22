import { gql } from '@apollo/client';

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    mobile
    email
    role
    kycStatus
    isActive
    ward {
      id
      name
      code
    }
    department {
      id
      name
    }
    availability {
      dayOfWeek
      startTime
      endTime
    }
  }
`;

export const REQUEST_BASE_FIELDS = gql`
  fragment RequestBaseFields on RequestBase {
    id
    type
    status
    adminReviewNote
    createdAt
    closedAt
    citizen {
      ...UserFields
    }
    ward {
      id
      name
      code
    }
    department {
      id
      name
    }
    assignedOfficer {
      ...UserFields
    }
    statusHistory {
      status
      changedAt
      note
      changedBy {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const REQUEST_UNION_FIELDS = gql`
  fragment RequestUnionFields on RequestUnion {
    __typename
    ... on Complaint {
      ...RequestBaseFields
      title
      category
      description
      address
      photos {
        url
        uploadedAt
      }
      resolutionProof {
        url
        uploadedAt
        uploadedBy {
          ...UserFields
        }
      }
      resolutionRemarks
    }
    ... on Appointment {
      ...RequestBaseFields
      purpose
      remarks
      confirmedDate
      confirmedTimeSlot
    }
  }
  ${REQUEST_BASE_FIELDS}
  ${USER_FIELDS}
`;
