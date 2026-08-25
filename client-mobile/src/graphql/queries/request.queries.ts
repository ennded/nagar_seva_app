import { gql } from '@apollo/client';
import { REQUEST_UNION_FIELDS } from '../fragments';

export const MY_REQUESTS = gql`
  query MyRequests($status: RequestStatus) {
    myRequests(status: $status) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;

export const REQUEST_DETAIL = gql`
  query RequestDetail($id: ID!) {
    request(id: $id) {
      ...RequestUnionFields
    }
  }
  ${REQUEST_UNION_FIELDS}
`;
