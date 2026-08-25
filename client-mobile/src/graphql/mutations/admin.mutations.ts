import { gql } from '@apollo/client';
import { REQUEST_UNION_FIELDS } from '../fragments';

// Wards
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

// Departments
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

// Staff accounts
export const CREATE_STAFF_USER = gql`
  mutation CreateStaffUser($input: CreateStaffUserInput!) {
    createStaffUser(input: $input) {
      id
      name
      role
    }
  }
`;
export const UPDATE_STAFF_USER = gql`
  mutation UpdateStaffUser($id: ID!, $input: UpdateStaffUserInput!) {
    updateStaffUser(id: $id, input: $input) {
      id
      name
    }
  }
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

// Requests: the only role with real write actions on the detail screen.
export const VERIFY_REQUEST = gql`
  mutation VerifyRequest($id: ID!, $approve: Boolean!, $note: String) {
    verifyRequest(id: $id, approve: $approve, note: $note) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;
export const ASSIGN_REQUEST = gql`
  mutation AssignRequest($id: ID!, $departmentId: ID!, $officerId: ID!) {
    assignRequest(id: $id, departmentId: $departmentId, officerId: $officerId) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;
export const REVIEW_AND_CLOSE = gql`
  mutation ReviewAndClose($id: ID!, $note: String) {
    reviewAndClose(id: $id, note: $note) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;
export const SET_REQUEST_PRIORITY = gql`
  mutation SetRequestPriority($id: ID!, $priority: RequestPriority!) {
    setRequestPriority(id: $id, priority: $priority) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;

// Announcements
export const PUBLISH_ANNOUNCEMENT = gql`
  mutation PublishAnnouncement($id: ID!) {
    publishAnnouncement(id: $id) {
      id
      status
      publishedAt
    }
  }
`;

// Emergency contacts
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

// Vehicles
export const CREATE_VEHICLE = gql`
  mutation CreateVehicle($input: CreateVehicleInput!) {
    createVehicle(input: $input) {
      id
      registrationNumber
    }
  }
`;
export const ASSIGN_VEHICLE_DRIVER = gql`
  mutation AssignVehicleDriver($vehicleId: ID!, $driverId: ID!) {
    assignVehicleDriver(vehicleId: $vehicleId, driverId: $driverId) {
      id
      driver {
        id
        name
      }
    }
  }
`;
