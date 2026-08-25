import { gql } from '@apollo/client';
import { REQUEST_UNION_FIELDS } from '../fragments';

export const SUBMIT_COMPLAINT = gql`
  mutation SubmitComplaint($input: SubmitComplaintInput!) {
    submitComplaint(input: $input) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;

export const SUBMIT_APPOINTMENT = gql`
  mutation SubmitAppointment($input: SubmitAppointmentInput!) {
    submitAppointment(input: $input) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;

export const START_WORK = gql`
  mutation StartWork($id: ID!) {
    startWork(id: $id) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;

export const COMPLETE_COMPLAINT = gql`
  mutation CompleteComplaint($id: ID!, $resolutionProofUrls: [String!]!, $remarks: String) {
    completeComplaint(id: $id, resolutionProofUrls: $resolutionProofUrls, remarks: $remarks) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;

export const SCHEDULE_APPOINTMENT = gql`
  mutation ScheduleAppointment($id: ID!, $confirmedDate: String!, $confirmedTimeSlot: String!) {
    scheduleAppointment(id: $id, confirmedDate: $confirmedDate, confirmedTimeSlot: $confirmedTimeSlot) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;
