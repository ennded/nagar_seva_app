import { gql } from '@apollo/client';
import { USER_FIELDS } from '../fragments';

export const REGISTER_CITIZEN = gql`
  mutation RegisterCitizen($input: RegisterCitizenInput!) {
    registerCitizen(input: $input) {
      token
      citySlug
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      citySlug
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const REQUEST_OTP = gql`
  mutation RequestOtp($mobile: String!) {
    requestOtp(mobile: $mobile)
  }
`;

// Testing-only: returns the plaintext OTP when the backend has EXPOSE_OTP_FOR_TESTING=true.
export const REQUEST_OTP_DEBUG = gql`
  mutation RequestOtpDebug($mobile: String!) {
    requestOtpDebug(mobile: $mobile)
  }
`;

export const VERIFY_OTP = gql`
  mutation VerifyOtp($mobile: String!, $code: String!) {
    verifyOtp(mobile: $mobile, code: $code) {
      token
      citySlug
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;
