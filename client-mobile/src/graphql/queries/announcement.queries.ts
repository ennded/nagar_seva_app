import { gql } from '@apollo/client';

export const WARD_ANNOUNCEMENTS = gql`
  query WardAnnouncements {
    wardAnnouncements {
      id
      title
      body
      category
      status
      isEmergency
      publishedAt
      createdAt
    }
  }
`;

// Admin + Nagaradhyaksh: every announcement in the city, drafts included.
export const ANNOUNCEMENTS_ADMIN = gql`
  query AnnouncementsAdmin {
    announcementsAdmin {
      id
      title
      body
      category
      status
      isEmergency
      publishedAt
      createdAt
    }
  }
`;
