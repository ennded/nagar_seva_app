import { gql } from '@apollo/client';
import { USER_FIELDS } from '../fragments';

export const OFFICERS_BY_DEPARTMENT = gql`
  query OfficersByDepartment($departmentId: ID!) {
    officersByDepartment(departmentId: $departmentId) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
