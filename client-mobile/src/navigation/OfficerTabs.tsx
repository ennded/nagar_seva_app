import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  AppointmentsStackParamList,
  ComplaintsStackParamList,
  OfficerTabParamList,
  ProfileStackParamList,
} from './officerTypes';
import { OfficerDashboardScreen } from '../screens/officer/OfficerDashboardScreen';
import { OfficerComplaintsListScreen } from '../screens/officer/OfficerComplaintsListScreen';
import { OfficerComplaintDetailScreen } from '../screens/officer/OfficerComplaintDetailScreen';
import { OfficerAppointmentsListScreen } from '../screens/officer/OfficerAppointmentsListScreen';
import { OfficerScheduleScreen } from '../screens/officer/OfficerScheduleScreen';
import { OfficerNotificationsScreen } from '../screens/officer/OfficerNotificationsScreen';
import { OfficerProfileScreen } from '../screens/officer/OfficerProfileScreen';
import { OfficerPerformanceScreen } from '../screens/officer/OfficerPerformanceScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<OfficerTabParamList>();
const ComplaintsStack = createNativeStackNavigator<ComplaintsStackParamList>();
const AppointmentsStack = createNativeStackNavigator<AppointmentsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ComplaintsStackNavigator() {
  return (
    <ComplaintsStack.Navigator screenOptions={{ headerShown: false }}>
      <ComplaintsStack.Screen name="ComplaintsList" component={OfficerComplaintsListScreen} />
      <ComplaintsStack.Screen name="ComplaintDetail" component={OfficerComplaintDetailScreen} />
    </ComplaintsStack.Navigator>
  );
}

function AppointmentsStackNavigator() {
  return (
    <AppointmentsStack.Navigator screenOptions={{ headerShown: false }}>
      <AppointmentsStack.Screen name="AppointmentsList" component={OfficerAppointmentsListScreen} />
      <AppointmentsStack.Screen name="Schedule" component={OfficerScheduleScreen} />
    </AppointmentsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={OfficerProfileScreen} />
      <ProfileStack.Screen name="Performance" component={OfficerPerformanceScreen} />
    </ProfileStack.Navigator>
  );
}

const TAB_ICON: Record<keyof OfficerTabParamList, string> = {
  DashboardTab: '🏠',
  ComplaintsTab: '📋',
  AppointmentsTab: '📅',
  AlertsTab: '🔔',
  ProfileTab: '👤',
};

const TAB_LABEL: Record<keyof OfficerTabParamList, string> = {
  DashboardTab: 'Dashboard',
  ComplaintsTab: 'Complaints',
  AppointmentsTab: 'Appointments',
  AlertsTab: 'Alerts',
  ProfileTab: 'Profile',
};

// Bottom tab bar stays visible across every officer screen, including nested detail/schedule
// pushes — matching officer-mock, which renders the tab bar as a permanent sibling of the
// content area rather than hiding it on detail screens.
export function OfficerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabel: TAB_LABEL[route.name as keyof OfficerTabParamList],
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICON[route.name as keyof OfficerTabParamList]}</Text>,
        tabBarStyle: { paddingTop: 6, height: 68, paddingBottom: 14 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="DashboardTab" component={OfficerDashboardScreen} />
      <Tab.Screen name="ComplaintsTab" component={ComplaintsStackNavigator} />
      <Tab.Screen name="AppointmentsTab" component={AppointmentsStackNavigator} />
      <Tab.Screen name="AlertsTab" component={OfficerNotificationsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
