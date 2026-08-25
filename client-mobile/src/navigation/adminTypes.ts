import type { NavigatorScreenParams } from '@react-navigation/native';

export type DashboardStackParamList = {
  Dashboard: undefined;
  Pending: undefined;
  Notifications: undefined;
};

export type RequestsStackParamList = {
  RequestsList: undefined;
  RequestDetail: { id: string };
};

// Wards/Departments/Vehicles have no dedicated tab slot in the mockup (5 tab spots, "City setup"
// has 4 screens) — reached from the Staff tab's own stack instead, same orphan-screen pattern as
// every other role's build.
export type StaffStackParamList = {
  StaffList: undefined;
  Wards: undefined;
  Departments: undefined;
  Vehicles: undefined;
};

// Emergency Contacts pairs with Announcements under "City duties" in the mockup's own grouping.
export type AnnouncementsStackParamList = {
  Announcements: undefined;
  Contacts: undefined;
};

export type AdminTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  RequestsTab: NavigatorScreenParams<RequestsStackParamList>;
  StaffTab: NavigatorScreenParams<StaffStackParamList>;
  AnnouncementsTab: NavigatorScreenParams<AnnouncementsStackParamList>;
  ProfileTab: undefined;
};
