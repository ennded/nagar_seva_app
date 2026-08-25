import { gql } from '@apollo/client';

export const MY_NOTIFICATIONS = gql`
  query MyNotifications($unreadOnly: Boolean) {
    myNotifications(unreadOnly: $unreadOnly) {
      id
      type
      message
      isRead
      requestId
      announcementId
      createdAt
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      id
      isRead
    }
  }
`;
