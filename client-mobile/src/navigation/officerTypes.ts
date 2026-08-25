import type { NavigatorScreenParams } from '@react-navigation/native';

// Officer's bottom-tab area: each tab that needs to push a detail screen (Complaints,
// Appointments) has its own nested stack so the bottom tab bar stays visible everywhere,
// matching officer-mock's persistent tab bar even on O5 (Complaint detail) and O7 (Schedule).
export type ComplaintsStackParamList = {
  ComplaintsList: undefined;
  ComplaintDetail: { id: string };
};

export type AppointmentsStackParamList = {
  AppointmentsList: undefined;
  Schedule: { id: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Performance: undefined;
};

export type OfficerTabParamList = {
  DashboardTab: undefined;
  ComplaintsTab: NavigatorScreenParams<ComplaintsStackParamList>;
  AppointmentsTab: NavigatorScreenParams<AppointmentsStackParamList>;
  AlertsTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
