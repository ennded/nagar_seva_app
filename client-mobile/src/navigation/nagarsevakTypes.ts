import type { NavigatorScreenParams } from '@react-navigation/native';

// Same "nested stack per tab that pushes" pattern as OfficerTabs, so the bottom tab bar stays
// visible on every screen including pushed detail views (matches nagarsevak-mock exactly — the
// tab bar renders as a permanent sibling of the content area, never hidden).
export type DashboardStackParamList = {
  Dashboard: undefined;
  WardAppointments: undefined;
  Notifications: undefined;
};

export type ComplaintsStackParamList = {
  ComplaintsList: undefined;
  ComplaintDetail: { id: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  WardReport: undefined;
};

export type NagarsevakTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  ComplaintsTab: NavigatorScreenParams<ComplaintsStackParamList>;
  GarbageTab: undefined;
  AnnouncementsTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
