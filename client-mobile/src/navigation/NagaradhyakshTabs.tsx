import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  NagaradhyakshTabParamList,
  OverviewStackParamList,
  ProfileStackParamList,
  RequestsStackParamList,
} from './nagaradhyakshTypes';
import { NagaradhyakshDashboardScreen } from '../screens/nagaradhyaksh/NagaradhyakshDashboardScreen';
import { NagaradhyakshNotificationsScreen } from '../screens/nagaradhyaksh/NagaradhyakshNotificationsScreen';
import { NagaradhyakshRequestsListScreen } from '../screens/nagaradhyaksh/NagaradhyakshRequestsListScreen';
import { NagaradhyakshRequestDetailScreen } from '../screens/nagaradhyaksh/NagaradhyakshRequestDetailScreen';
import { NagaradhyakshWardPerformanceScreen } from '../screens/nagaradhyaksh/NagaradhyakshWardPerformanceScreen';
import { NagaradhyakshAnnouncementsScreen } from '../screens/nagaradhyaksh/NagaradhyakshAnnouncementsScreen';
import { NagaradhyakshProfileScreen } from '../screens/nagaradhyaksh/NagaradhyakshProfileScreen';
import { NagaradhyakshSettingsScreen } from '../screens/nagaradhyaksh/NagaradhyakshSettingsScreen';
import { NagaradhyakshDepartmentPerformanceScreen } from '../screens/nagaradhyaksh/NagaradhyakshDepartmentPerformanceScreen';
import { NagaradhyakshAnalyticsScreen } from '../screens/nagaradhyaksh/NagaradhyakshAnalyticsScreen';
import { NagaradhyakshGarbageScreen } from '../screens/nagaradhyaksh/NagaradhyakshGarbageScreen';
import { NagaradhyakshReportScreen } from '../screens/nagaradhyaksh/NagaradhyakshReportScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<NagaradhyakshTabParamList>();
const OverviewStack = createNativeStackNavigator<OverviewStackParamList>();
const RequestsStack = createNativeStackNavigator<RequestsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function OverviewStackNavigator() {
  return (
    <OverviewStack.Navigator screenOptions={{ headerShown: false }}>
      <OverviewStack.Screen name="Overview" component={NagaradhyakshDashboardScreen} />
      <OverviewStack.Screen name="Notifications" component={NagaradhyakshNotificationsScreen} />
    </OverviewStack.Navigator>
  );
}

function RequestsStackNavigator() {
  return (
    <RequestsStack.Navigator screenOptions={{ headerShown: false }}>
      <RequestsStack.Screen name="RequestsList" component={NagaradhyakshRequestsListScreen} />
      <RequestsStack.Screen name="RequestDetail" component={NagaradhyakshRequestDetailScreen} />
    </RequestsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={NagaradhyakshProfileScreen} />
      <ProfileStack.Screen name="Settings" component={NagaradhyakshSettingsScreen} />
      <ProfileStack.Screen name="DepartmentPerformance" component={NagaradhyakshDepartmentPerformanceScreen} />
      <ProfileStack.Screen name="Analytics" component={NagaradhyakshAnalyticsScreen} />
      <ProfileStack.Screen name="Garbage" component={NagaradhyakshGarbageScreen} />
      <ProfileStack.Screen name="CityReport" component={NagaradhyakshReportScreen} />
    </ProfileStack.Navigator>
  );
}

const TAB_ICON: Record<keyof NagaradhyakshTabParamList, string> = {
  OverviewTab: '📊',
  RequestsTab: '📋',
  WardsTab: '🗺️',
  AnnouncementsTab: '📣',
  ProfileTab: '👤',
};

const TAB_LABEL: Record<keyof NagaradhyakshTabParamList, string> = {
  OverviewTab: 'Overview',
  RequestsTab: 'Requests',
  WardsTab: 'Wards',
  AnnouncementsTab: 'Notices',
  ProfileTab: 'Profile',
};

export function NagaradhyakshTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabel: TAB_LABEL[route.name as keyof NagaradhyakshTabParamList],
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICON[route.name as keyof NagaradhyakshTabParamList]}</Text>,
        tabBarStyle: { paddingTop: 6, height: 68, paddingBottom: 14 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="OverviewTab" component={OverviewStackNavigator} />
      <Tab.Screen name="RequestsTab" component={RequestsStackNavigator} />
      <Tab.Screen name="WardsTab" component={NagaradhyakshWardPerformanceScreen} />
      <Tab.Screen name="AnnouncementsTab" component={NagaradhyakshAnnouncementsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
