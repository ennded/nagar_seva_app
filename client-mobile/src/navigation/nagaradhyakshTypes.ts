import type { NavigatorScreenParams } from '@react-navigation/native';

export type OverviewStackParamList = {
  Overview: undefined;
  Notifications: undefined;
};

export type RequestsStackParamList = {
  RequestsList: { wardId?: string } | undefined;
  RequestDetail: { id: string };
};

// Department Performance, Complaint Analytics, Garbage Monitoring and City Report have no
// dedicated bottom-tab slot in the mockup (only 5 tab spots exist for 15 screens) — like
// Officer's Performance and Nagarsevak's Ward Report, they're reached from Profile instead.
export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  DepartmentPerformance: undefined;
  Analytics: undefined;
  Garbage: undefined;
  CityReport: undefined;
};

export type NagaradhyakshTabParamList = {
  OverviewTab: NavigatorScreenParams<OverviewStackParamList>;
  RequestsTab: NavigatorScreenParams<RequestsStackParamList>;
  WardsTab: undefined;
  AnnouncementsTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
