import { gql } from '@apollo/client';
import { REQUEST_UNION_FIELDS } from '../fragments';

export const MY_ASSIGNED_REQUESTS = gql`
  query MyAssignedRequests($status: RequestStatus) {
    myAssignedRequests(status: $status) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;
