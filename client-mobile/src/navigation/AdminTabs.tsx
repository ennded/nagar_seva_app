import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  AdminTabParamList,
  AnnouncementsStackParamList,
  DashboardStackParamList,
  RequestsStackParamList,
  StaffStackParamList,
} from './adminTypes';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminPendingScreen } from '../screens/admin/AdminPendingScreen';
import { AdminNotificationsScreen } from '../screens/admin/AdminNotificationsScreen';
import { AdminRequestsListScreen } from '../screens/admin/AdminRequestsListScreen';
import { AdminRequestDetailScreen } from '../screens/admin/AdminRequestDetailScreen';
import { AdminStaffScreen } from '../screens/admin/AdminStaffScreen';
import { AdminWardsScreen } from '../screens/admin/AdminWardsScreen';
import { AdminDepartmentsScreen } from '../screens/admin/AdminDepartmentsScreen';
import { AdminVehiclesScreen } from '../screens/admin/AdminVehiclesScreen';
import { AdminAnnouncementsScreen } from '../screens/admin/AdminAnnouncementsScreen';
import { AdminContactsScreen } from '../screens/admin/AdminContactsScreen';
import { AdminProfileScreen } from '../screens/admin/AdminProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const RequestsStack = createNativeStackNavigator<RequestsStackParamList>();
const StaffStack = createNativeStackNavigator<StaffStackParamList>();
const AnnouncementsStack = createNativeStackNavigator<AnnouncementsStackParamList>();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="Dashboard" component={AdminDashboardScreen} />
      <DashboardStack.Screen name="Pending" component={AdminPendingScreen} />
      <DashboardStack.Screen name="Notifications" component={AdminNotificationsScreen} />
    </DashboardStack.Navigator>
  );
}

function RequestsStackNavigator() {
  return (
    <RequestsStack.Navigator screenOptions={{ headerShown: false }}>
      <RequestsStack.Screen name="RequestsList" component={AdminRequestsListScreen} />
      <RequestsStack.Screen name="RequestDetail" component={AdminRequestDetailScreen} />
    </RequestsStack.Navigator>
  );
}

function StaffStackNavigator() {
  return (
    <StaffStack.Navigator screenOptions={{ headerShown: false }}>
      <StaffStack.Screen name="StaffList" component={AdminStaffScreen} />
      <StaffStack.Screen name="Wards" component={AdminWardsScreen} />
      <StaffStack.Screen name="Departments" component={AdminDepartmentsScreen} />
      <StaffStack.Screen name="Vehicles" component={AdminVehiclesScreen} />
    </StaffStack.Navigator>
  );
}

function AnnouncementsStackNavigator() {
  return (
    <AnnouncementsStack.Navigator screenOptions={{ headerShown: false }}>
      <AnnouncementsStack.Screen name="Announcements" component={AdminAnnouncementsScreen} />
      <AnnouncementsStack.Screen name="Contacts" component={AdminContactsScreen} />
    </AnnouncementsStack.Navigator>
  );
}

const TAB_ICON: Record<keyof AdminTabParamList, string> = {
  DashboardTab: '📊',
  RequestsTab: '📋',
  StaffTab: '👥',
  AnnouncementsTab: '📣',
  ProfileTab: '👤',
};

const TAB_LABEL: Record<keyof AdminTabParamList, string> = {
  DashboardTab: 'Dashboard',
  RequestsTab: 'Requests',
  StaffTab: 'Staff',
  AnnouncementsTab: 'Notices',
  ProfileTab: 'Profile',
};

export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabel: TAB_LABEL[route.name as keyof AdminTabParamList],
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICON[route.name as keyof AdminTabParamList]}</Text>,
        tabBarStyle: { paddingTop: 6, height: 68, paddingBottom: 14 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStackNavigator} />
      <Tab.Screen name="RequestsTab" component={RequestsStackNavigator} />
      <Tab.Screen name="StaffTab" component={StaffStackNavigator} />
      <Tab.Screen name="AnnouncementsTab" component={AnnouncementsStackNavigator} />
      <Tab.Screen name="ProfileTab" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
}
