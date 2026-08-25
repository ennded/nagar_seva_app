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

export const SET_LANGUAGE = gql`
  mutation SetLanguage($language: Language!) {
    setLanguage(language: $language)
  }
`;
