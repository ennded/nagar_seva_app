import { gql } from '@apollo/client';
import { USER_FIELDS } from '../fragments';

export const CREATE_WARD = gql`
  mutation CreateWard($name: String!, $code: String!) {
    createWard(name: $name, code: $code) {
      id
      name
      code
    }
  }
`;

export const UPDATE_WARD = gql`
  mutation UpdateWard($id: ID!, $name: String, $code: String) {
    updateWard(id: $id, name: $name, code: $code) {
      id
      name
      code
    }
  }
`;

export const DELETE_WARD = gql`
  mutation DeleteWard($id: ID!) {
    deleteWard(id: $id)
  }
`;

export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($name: String!, $description: String) {
    createDepartment(name: $name, description: $description) {
      id
      name
      description
    }
  }
`;

export const UPDATE_DEPARTMENT = gql`
  mutation UpdateDepartment($id: ID!, $name: String, $description: String) {
    updateDepartment(id: $id, name: $name, description: $description) {
      id
      name
      description
    }
  }
`;

export const DELETE_DEPARTMENT = gql`
  mutation DeleteDepartment($id: ID!) {
    deleteDepartment(id: $id)
  }
`;

export const CREATE_STAFF_USER = gql`
  mutation CreateStaffUser($input: CreateStaffUserInput!) {
    createStaffUser(input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_STAFF_USER = gql`
  mutation UpdateStaffUser($id: ID!, $input: UpdateStaffUserInput!) {
    updateStaffUser(id: $id, input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const SET_STAFF_ACTIVE = gql`
  mutation SetStaffActive($id: ID!, $isActive: Boolean!) {
    setStaffActive(id: $id, isActive: $isActive) {
      id
      isActive
    }
  }
`;

export const DELETE_STAFF_USER = gql`
  mutation DeleteStaffUser($id: ID!) {
    deleteStaffUser(id: $id)
  }
`;

export const SET_REQUEST_PRIORITY = gql`
  mutation SetRequestPriority($id: ID!, $priority: RequestPriority!) {
    setRequestPriority(id: $id, priority: $priority) {
      __typename
      ... on Complaint {
        id
        priority
      }
      ... on Appointment {
        id
        priority
      }
    }
  }
`;

export const VERIFY_REQUEST = gql`
  mutation VerifyRequest($id: ID!, $approve: Boolean!, $note: String) {
    verifyRequest(id: $id, approve: $approve, note: $note) {
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

export const ASSIGN_REQUEST = gql`
  mutation AssignRequest($id: ID!, $departmentId: ID!, $officerId: ID!) {
    assignRequest(id: $id, departmentId: $departmentId, officerId: $officerId) {
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

export const REVIEW_AND_CLOSE = gql`
  mutation ReviewAndClose($id: ID!, $note: String) {
    reviewAndClose(id: $id, note: $note) {
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

export const CREATE_ANNOUNCEMENT = gql`
  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
    createAnnouncement(input: $input) {
      id
      title
      status
      isEmergency
    }
  }
`;

export const PUBLISH_ANNOUNCEMENT = gql`
  mutation PublishAnnouncement($id: ID!) {
    publishAnnouncement(id: $id) {
      id
      status
      publishedAt
    }
  }
`;

export const DELETE_ANNOUNCEMENT = gql`
  mutation DeleteAnnouncement($id: ID!) {
    deleteAnnouncement(id: $id)
  }
`;

export const CREATE_EMERGENCY_CONTACT = gql`
  mutation CreateEmergencyContact($input: CreateEmergencyContactInput!) {
    createEmergencyContact(input: $input) {
      id
      name
      category
      phoneNumber
      order
    }
  }
`;

export const UPDATE_EMERGENCY_CONTACT = gql`
  mutation UpdateEmergencyContact($id: ID!, $input: CreateEmergencyContactInput!) {
    updateEmergencyContact(id: $id, input: $input) {
      id
      name
      category
      phoneNumber
      order
    }
  }
`;

export const DELETE_EMERGENCY_CONTACT = gql`
  mutation DeleteEmergencyContact($id: ID!) {
    deleteEmergencyContact(id: $id)
  }
`;
