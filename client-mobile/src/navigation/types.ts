import type { Announcement } from '../graphql/types';

export type StaffRole = 'ADMIN' | 'OFFICER' | 'NAGARSEVAK' | 'NAGARADHYAKSH' | 'DRIVER';

export type RootStackParamList = {
  Splash: undefined;
  CityPicker: undefined;
  Landing: undefined;
  LoginEmail: undefined;
  LoginMobile: undefined;
  OtpEntry: { mobile: string };
  Register: undefined;
  StaffRoleSelect: undefined;
  StaffLogin: { role: StaffRole };
  DriverLogin: undefined;
  DriverOtp: { mobile: string };
  OfficerLogin: undefined;
  OfficerOtp: { mobile: string };
  NagarsevakLogin: undefined;
  NagarsevakOtp: { mobile: string };
  NagaradhyakshLogin: undefined;
  NagaradhyakshOtp: { mobile: string };
  AdminLogin: undefined;
  AdminOtp: { mobile: string };

  Home: undefined;
  DriverDashboard: undefined;
  OfficerTabs: undefined;
  NagarsevakTabs: undefined;
  NagaradhyakshTabs: undefined;
  AdminTabs: undefined;
  ComplaintWizard: { category?: string } | undefined;
  AppointmentWizard: undefined;
  MyRequests: { initialTab?: 'COMPLAINT' | 'APPOINTMENT' } | undefined;
  RequestDetail: { id: string };
  Notices: undefined;
  NoticeDetail: { announcement: Announcement };
  GarbageTracking: undefined;
  EmergencyContacts: undefined;
  Notifications: undefined;

  // Presented as native modals.
  PhotoViewer: { urls: string[]; startIndex: number };
  AccountSheet: undefined;
};
