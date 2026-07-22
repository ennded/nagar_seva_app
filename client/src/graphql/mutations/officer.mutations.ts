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

export const SCHEDULE_APPOINTMENT = gql`
  mutation ScheduleAppointment($id: ID!, $confirmedDate: String!, $confirmedTimeSlot: String!) {
    scheduleAppointment(id: $id, confirmedDate: $confirmedDate, confirmedTimeSlot: $confirmedTimeSlot) {
      id
      status
    }
  }
`;

export const UPDATE_MY_AVAILABILITY = gql`
  mutation UpdateMyAvailability($slots: [AvailabilitySlotInput!]!) {
    updateMyAvailability(slots: $slots) {
      id
      availability {
        dayOfWeek
        startTime
        endTime
      }
    }
  }
`;
