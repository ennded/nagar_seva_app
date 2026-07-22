import { gql } from '@apollo/client';
import { USER_FIELDS } from '../fragments';

export const ME = gql`
  query Me {
    me {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
