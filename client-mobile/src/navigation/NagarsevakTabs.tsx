import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  ComplaintsStackParamList,
  DashboardStackParamList,
  NagarsevakTabParamList,
  ProfileStackParamList,
} from './nagarsevakTypes';
import { NagarsevakDashboardScreen } from '../screens/nagarsevak/NagarsevakDashboardScreen';
import { NagarsevakAppointmentsScreen } from '../screens/nagarsevak/NagarsevakAppointmentsScreen';
import { NagarsevakNotificationsScreen } from '../screens/nagarsevak/NagarsevakNotificationsScreen';
import { NagarsevakComplaintsListScreen } from '../screens/nagarsevak/NagarsevakComplaintsListScreen';
import { NagarsevakComplaintDetailScreen } from '../screens/nagarsevak/NagarsevakComplaintDetailScreen';
import { NagarsevakGarbageScreen } from '../screens/nagarsevak/NagarsevakGarbageScreen';
import { NagarsevakAnnouncementsScreen } from '../screens/nagarsevak/NagarsevakAnnouncementsScreen';
import { NagarsevakProfileScreen } from '../screens/nagarsevak/NagarsevakProfileScreen';
import { NagarsevakReportScreen } from '../screens/nagarsevak/NagarsevakReportScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<NagarsevakTabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const ComplaintsStack = createNativeStackNavigator<ComplaintsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="Dashboard" component={NagarsevakDashboardScreen} />
      <DashboardStack.Screen name="WardAppointments" component={NagarsevakAppointmentsScreen} />
      <DashboardStack.Screen name="Notifications" component={NagarsevakNotificationsScreen} />
    </DashboardStack.Navigator>
  );
}

function ComplaintsStackNavigator() {
  return (
    <ComplaintsStack.Navigator screenOptions={{ headerShown: false }}>
      <ComplaintsStack.Screen name="ComplaintsList" component={NagarsevakComplaintsListScreen} />
      <ComplaintsStack.Screen name="ComplaintDetail" component={NagarsevakComplaintDetailScreen} />
    </ComplaintsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={NagarsevakProfileScreen} />
      <ProfileStack.Screen name="WardReport" component={NagarsevakReportScreen} />
    </ProfileStack.Navigator>
  );
}

const TAB_ICON: Record<keyof NagarsevakTabParamList, string> = {
  DashboardTab: '🏠',
  ComplaintsTab: '📋',
  GarbageTab: '🚛',
  AnnouncementsTab: '📣',
  ProfileTab: '👤',
};

const TAB_LABEL: Record<keyof NagarsevakTabParamList, string> = {
  DashboardTab: 'Ward',
  ComplaintsTab: 'Complaints',
  GarbageTab: 'Garbage',
  AnnouncementsTab: 'Notices',
  ProfileTab: 'Profile',
};

// Same persistent-tab-bar architecture as OfficerTabs — nested stacks per tab so pushed detail
// screens (Complaint detail, Ward Report, etc.) never hide the bottom tabs, matching
// nagarsevak-mock's layout.
export function NagarsevakTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabel: TAB_LABEL[route.name as keyof NagarsevakTabParamList],
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICON[route.name as keyof NagarsevakTabParamList]}</Text>,
        tabBarStyle: { paddingTop: 6, height: 68, paddingBottom: 14 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStackNavigator} />
      <Tab.Screen name="ComplaintsTab" component={ComplaintsStackNavigator} />
      <Tab.Screen name="GarbageTab" component={NagarsevakGarbageScreen} />
      <Tab.Screen name="AnnouncementsTab" component={NagarsevakAnnouncementsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
