import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { StaffLoginPage } from './features/auth/StaffLoginPage';
import { CitizenDashboardHome } from './features/citizen/CitizenDashboardHome';
import { MyRequestsPage } from './features/citizen/MyRequestsPage';
import { SubmitComplaintPage } from './features/citizen/SubmitComplaintPage';
import { SubmitAppointmentPage } from './features/citizen/SubmitAppointmentPage';
import { RequestDetailPage } from './features/citizen/RequestDetailPage';
import { NoticesPage } from './features/citizen/NoticesPage';
import { CitizenEmergencyContactsPage } from './features/citizen/CitizenEmergencyContactsPage';
import { AdminLayout } from './features/admin/AdminLayout';
import { AdminDashboardHome } from './features/admin/AdminDashboardHome';
import { WardsPage } from './features/admin/WardsPage';
import { DepartmentsPage } from './features/admin/DepartmentsPage';
import { StaffPage } from './features/admin/StaffPage';
import { PendingRequestsPage } from './features/admin/PendingRequestsPage';
import { AppointmentsPage } from './features/admin/AppointmentsPage';
import { AllRequestsPage } from './features/admin/AllRequestsPage';
import { AdminRequestDetailPage } from './features/admin/AdminRequestDetailPage';
import { AnnouncementsPage } from './features/admin/AnnouncementsPage';
import { EmergencyContactsPage } from './features/admin/EmergencyContactsPage';
import { UsersPage } from './features/admin/UsersPage';
import { ReportsPage } from './features/admin/ReportsPage';
import { AnalyticsPage } from './features/admin/AnalyticsPage';
import { OfficerLayout } from './features/officer/OfficerLayout';
import { OfficerDashboardPage } from './features/officer/OfficerDashboardPage';
import { MyComplaintsPage } from './features/officer/MyComplaintsPage';
import { OfficerAppointmentsPage } from './features/officer/OfficerAppointmentsPage';
import { OfficerNotificationsPage } from './features/officer/OfficerNotificationsPage';
import { OfficerPerformancePage } from './features/officer/OfficerPerformancePage';
import { OfficerProfilePage } from './features/officer/OfficerProfilePage';
import { OfficerRequestDetailPage } from './features/officer/OfficerRequestDetailPage';
import { NagarsevakLayout } from './features/nagarsevak/NagarsevakLayout';
import { NagarsevakDashboardPage } from './features/nagarsevak/NagarsevakDashboardPage';
import { WardComplaintsPage } from './features/nagarsevak/WardComplaintsPage';
import { WardAppointmentsPage } from './features/nagarsevak/WardAppointmentsPage';
import { WardReportsPage } from './features/nagarsevak/WardReportsPage';
import { WardNotificationsPage } from './features/nagarsevak/WardNotificationsPage';
import { NagarsevakProfilePage } from './features/nagarsevak/NagarsevakProfilePage';
import { NagaradhyakshLayout } from './features/nagaradhyaksh/NagaradhyakshLayout';
import { NagaradhyakshOverviewPage } from './features/nagaradhyaksh/NagaradhyakshOverviewPage';
import { MunicipalityRequestsPage } from './features/nagaradhyaksh/MunicipalityRequestsPage';
import { CityAnnouncementsPage } from './features/nagaradhyaksh/CityAnnouncementsPage';
import { WardPerformancePage } from './features/nagaradhyaksh/WardPerformancePage';
import { DepartmentPerformancePage } from './features/nagaradhyaksh/DepartmentPerformancePage';
import { ComplaintAnalyticsPage } from './features/nagaradhyaksh/ComplaintAnalyticsPage';
import { GarbageMonitoringPage } from './features/nagaradhyaksh/GarbageMonitoringPage';
import { NagaradhyakshNotificationsPage } from './features/nagaradhyaksh/NagaradhyakshNotificationsPage';
import { NagaradhyakshProfilePage } from './features/nagaradhyaksh/NagaradhyakshProfilePage';
import { NagaradhyakshSettingsPage } from './features/nagaradhyaksh/NagaradhyakshSettingsPage';
import { ReportsPage as NagaradhyakshReportsPage } from './features/admin/ReportsPage';
import { MonitorRequestDetailPage } from './features/monitor/MonitorRequestDetailPage';
import { VehiclesPage } from './features/admin/VehiclesPage';
import { GarbageTrackingPage } from './features/citizen/GarbageTrackingPage';
import { WardGarbagePage } from './features/nagarsevak/WardGarbagePage';
import { WardAnnouncementsPage } from './features/nagarsevak/WardAnnouncementsPage';
import { DriverLayout } from './features/driver/DriverLayout';
import { DriverDashboardPage } from './features/driver/DriverDashboardPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/:citySlug" element={<LandingPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/:citySlug/login" element={<LoginPage />} />
        <Route path="/:citySlug/register" element={<RegisterPage />} />
        <Route path="/:citySlug/staff-login" element={<StaffLoginPage />} />
        <Route path="/:citySlug/staff-login/:role" element={<StaffLoginPage />} />
      </Route>

      <Route path="/:citySlug/citizen" element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<CitizenDashboardHome />} />
          <Route path="new-complaint" element={<SubmitComplaintPage />} />
          <Route path="new-appointment" element={<SubmitAppointmentPage />} />
          <Route path="requests" element={<MyRequestsPage />} />
          <Route path="requests/:id" element={<RequestDetailPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="garbage" element={<GarbageTrackingPage />} />
          <Route path="emergency-contacts" element={<CitizenEmergencyContactsPage />} />
        </Route>
      </Route>

      <Route path="/:citySlug/admin" element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardHome />} />
          <Route path="requests" element={<PendingRequestsPage />} />
          <Route path="requests/all" element={<AllRequestsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="requests/:id" element={<AdminRequestDetailPage />} />
          <Route path="wards" element={<WardsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="emergency-contacts" element={<EmergencyContactsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="/:citySlug/officer" element={<ProtectedRoute allowedRoles={['OFFICER']} />}>
        <Route element={<OfficerLayout />}>
          <Route index element={<OfficerDashboardPage />} />
          <Route path="complaints" element={<MyComplaintsPage />} />
          <Route path="appointments" element={<OfficerAppointmentsPage />} />
          <Route path="notifications" element={<OfficerNotificationsPage />} />
          <Route path="performance" element={<OfficerPerformancePage />} />
          <Route path="profile" element={<OfficerProfilePage />} />
          <Route path="requests/:id" element={<OfficerRequestDetailPage />} />
        </Route>
      </Route>

      <Route path="/:citySlug/nagarsevak" element={<ProtectedRoute allowedRoles={['NAGARSEVAK']} />}>
        <Route element={<NagarsevakLayout />}>
          <Route index element={<NagarsevakDashboardPage />} />
          <Route path="complaints" element={<WardComplaintsPage />} />
          <Route path="appointments" element={<WardAppointmentsPage />} />
          <Route path="garbage" element={<WardGarbagePage />} />
          <Route path="announcements" element={<WardAnnouncementsPage />} />
          <Route path="reports" element={<WardReportsPage />} />
          <Route path="notifications" element={<WardNotificationsPage />} />
          <Route path="profile" element={<NagarsevakProfilePage />} />
          <Route path="requests/:id" element={<MonitorRequestDetailPage />} />
        </Route>
      </Route>

      <Route path="/:citySlug/driver" element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
        <Route element={<DriverLayout />}>
          <Route index element={<DriverDashboardPage />} />
        </Route>
      </Route>

      <Route path="/:citySlug/nagaradhyaksh" element={<ProtectedRoute allowedRoles={['NAGARADHYAKSH']} />}>
        <Route element={<NagaradhyakshLayout />}>
          <Route index element={<NagaradhyakshOverviewPage />} />
          <Route path="requests" element={<MunicipalityRequestsPage />} />
          <Route path="requests/:id" element={<MonitorRequestDetailPage />} />
          <Route path="ward-performance" element={<WardPerformancePage />} />
          <Route path="department-performance" element={<DepartmentPerformancePage />} />
          <Route path="complaint-analytics" element={<ComplaintAnalyticsPage />} />
          <Route path="garbage-monitoring" element={<GarbageMonitoringPage />} />
          <Route path="announcements" element={<CityAnnouncementsPage />} />
          <Route path="reports" element={<NagaradhyakshReportsPage />} />
          <Route path="notifications" element={<NagaradhyakshNotificationsPage />} />
          <Route path="profile" element={<NagaradhyakshProfilePage />} />
          <Route path="settings" element={<NagaradhyakshSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
