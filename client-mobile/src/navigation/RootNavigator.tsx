import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';
import { colors } from '../theme';

import { SplashScreen } from '../screens/auth/SplashScreen';
import { CityPickerScreen } from '../screens/auth/CityPickerScreen';
import { LandingScreen } from '../screens/auth/LandingScreen';
import { LoginEmailScreen } from '../screens/auth/LoginEmailScreen';
import { LoginMobileScreen } from '../screens/auth/LoginMobileScreen';
import { OtpEntryScreen } from '../screens/auth/OtpEntryScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { StaffRoleSelectScreen } from '../screens/auth/StaffRoleSelectScreen';
import { StaffLoginScreen } from '../screens/auth/StaffLoginScreen';
import { DriverLoginScreen } from '../screens/driver/DriverLoginScreen';
import { DriverOtpScreen } from '../screens/driver/DriverOtpScreen';
import { DriverDashboardScreen } from '../screens/driver/DriverDashboardScreen';
import { OfficerLoginScreen } from '../screens/officer/OfficerLoginScreen';
import { OfficerOtpScreen } from '../screens/officer/OfficerOtpScreen';
import { OfficerTabs } from './OfficerTabs';
import { NagarsevakLoginScreen } from '../screens/nagarsevak/NagarsevakLoginScreen';
import { NagarsevakOtpScreen } from '../screens/nagarsevak/NagarsevakOtpScreen';
import { NagarsevakTabs } from './NagarsevakTabs';
import { NagaradhyakshLoginScreen } from '../screens/nagaradhyaksh/NagaradhyakshLoginScreen';
import { NagaradhyakshOtpScreen } from '../screens/nagaradhyaksh/NagaradhyakshOtpScreen';
import { NagaradhyakshTabs } from './NagaradhyakshTabs';
import { AdminLoginScreen } from '../screens/admin/AdminLoginScreen';
import { AdminOtpScreen } from '../screens/admin/AdminOtpScreen';
import { AdminTabs } from './AdminTabs';

import { HomeScreen } from '../screens/citizen/HomeScreen';
import { ComplaintWizardScreen } from '../screens/citizen/ComplaintWizardScreen';
import { AppointmentWizardScreen } from '../screens/citizen/AppointmentWizardScreen';
import { MyRequestsScreen } from '../screens/citizen/MyRequestsScreen';
import { RequestDetailScreen } from '../screens/citizen/RequestDetailScreen';
import { PhotoViewerScreen } from '../screens/citizen/PhotoViewerScreen';
import { NoticesScreen } from '../screens/citizen/NoticesScreen';
import { NoticeDetailScreen } from '../screens/citizen/NoticeDetailScreen';
import { GarbageTrackingScreen } from '../screens/citizen/GarbageTrackingScreen';
import { EmergencyContactsScreen } from '../screens/citizen/EmergencyContactsScreen';
import { NotificationsScreen } from '../screens/citizen/NotificationsScreen';
import { AccountSheetScreen } from '../screens/citizen/AccountSheetScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const plainHeader = {
  headerShown: true,
  headerTitle: '',
  headerShadowVisible: false,
  headerTintColor: colors.navy,
  headerStyle: { backgroundColor: colors.background },
} as const;

export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="CityPicker" component={CityPickerScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="LoginEmail" component={LoginEmailScreen} options={plainHeader} />
        <Stack.Screen name="LoginMobile" component={LoginMobileScreen} options={plainHeader} />
        <Stack.Screen name="OtpEntry" component={OtpEntryScreen} options={plainHeader} />
        <Stack.Screen name="Register" component={RegisterScreen} options={plainHeader} />
        <Stack.Screen name="StaffRoleSelect" component={StaffRoleSelectScreen} options={plainHeader} />
        <Stack.Screen name="StaffLogin" component={StaffLoginScreen} options={plainHeader} />
        <Stack.Screen name="DriverLogin" component={DriverLoginScreen} options={plainHeader} />
        <Stack.Screen name="DriverOtp" component={DriverOtpScreen} options={plainHeader} />
        <Stack.Screen name="OfficerLogin" component={OfficerLoginScreen} options={plainHeader} />
        <Stack.Screen name="OfficerOtp" component={OfficerOtpScreen} options={plainHeader} />
        <Stack.Screen name="NagarsevakLogin" component={NagarsevakLoginScreen} options={plainHeader} />
        <Stack.Screen name="NagarsevakOtp" component={NagarsevakOtpScreen} options={plainHeader} />
        <Stack.Screen name="NagaradhyakshLogin" component={NagaradhyakshLoginScreen} options={plainHeader} />
        <Stack.Screen name="NagaradhyakshOtp" component={NagaradhyakshOtpScreen} options={plainHeader} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={plainHeader} />
        <Stack.Screen name="AdminOtp" component={AdminOtpScreen} options={plainHeader} />

        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} />
        <Stack.Screen name="OfficerTabs" component={OfficerTabs} />
        <Stack.Screen name="NagarsevakTabs" component={NagarsevakTabs} />
        <Stack.Screen name="NagaradhyakshTabs" component={NagaradhyakshTabs} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
        <Stack.Screen
          name="ComplaintWizard"
          component={ComplaintWizardScreen}
          options={{ ...plainHeader, headerTitle: 'New Complaint' }}
        />
        <Stack.Screen
          name="AppointmentWizard"
          component={AppointmentWizardScreen}
          options={{ ...plainHeader, headerTitle: 'Book Appointment' }}
        />
        <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={plainHeader} />
        <Stack.Screen name="Notices" component={NoticesScreen} />
        <Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} options={plainHeader} />
        <Stack.Screen
          name="GarbageTracking"
          component={GarbageTrackingScreen}
          options={{ ...plainHeader, headerTitle: 'Garbage Tracking' }}
        />
        <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />

        <Stack.Screen
          name="PhotoViewer"
          component={PhotoViewerScreen}
          options={{ presentation: 'fullScreenModal', animation: 'fade' }}
        />
        <Stack.Screen
          name="AccountSheet"
          component={AccountSheetScreen}
          options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
