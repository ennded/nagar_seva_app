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
