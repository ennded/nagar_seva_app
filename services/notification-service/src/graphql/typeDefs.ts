import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Notification @key(fields: "id") {
    id: ID!
    type: String!
    message: String!
    isRead: Boolean!
    requestId: ID
    announcementId: ID
    createdAt: String!
  }

  type Query {
    myNotifications(unreadOnly: Boolean): [Notification!]!
  }

  type Mutation {
    markNotificationRead(id: ID!): Notification!
  }
`;
