import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CityPickerPage } from './features/landing/CityPickerPage';
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
import { AllRequestsPage } from './features/admin/AllRequestsPage';
import { AdminRequestDetailPage } from './features/admin/AdminRequestDetailPage';
import { AnnouncementsPage } from './features/admin/AnnouncementsPage';
import { EmergencyContactsPage } from './features/admin/EmergencyContactsPage';
import { OfficerLayout } from './features/officer/OfficerLayout';
import { AssignedRequestsPage } from './features/officer/AssignedRequestsPage';
import { OfficerRequestDetailPage } from './features/officer/OfficerRequestDetailPage';
import { AvailabilityPage } from './features/officer/AvailabilityPage';
import { NagarsevakLayout } from './features/nagarsevak/NagarsevakLayout';
import { WardRequestsPage } from './features/nagarsevak/WardRequestsPage';
import { NagaradhyakshLayout } from './features/nagaradhyaksh/NagaradhyakshLayout';
import { NagaradhyakshOverviewPage } from './features/nagaradhyaksh/NagaradhyakshOverviewPage';
import { MunicipalityRequestsPage } from './features/nagaradhyaksh/MunicipalityRequestsPage';
import { CityAnnouncementsPage } from './features/nagaradhyaksh/CityAnnouncementsPage';
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
      <Route path="/" element={<CityPickerPage />} />

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
          <Route path="requests/:id" element={<AdminRequestDetailPage />} />
          <Route path="wards" element={<WardsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="emergency-contacts" element={<EmergencyContactsPage />} />
        </Route>
      </Route>

      <Route path="/:citySlug/officer" element={<ProtectedRoute allowedRoles={['OFFICER']} />}>
        <Route element={<OfficerLayout />}>
          <Route index element={<AssignedRequestsPage />} />
          <Route path="requests/:id" element={<OfficerRequestDetailPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
        </Route>
      </Route>

      <Route path="/:citySlug/nagarsevak" element={<ProtectedRoute allowedRoles={['NAGARSEVAK']} />}>
        <Route element={<NagarsevakLayout />}>
          <Route index element={<WardRequestsPage />} />
          <Route path="requests/:id" element={<MonitorRequestDetailPage />} />
          <Route path="announcements" element={<WardAnnouncementsPage />} />
          <Route path="garbage" element={<WardGarbagePage />} />
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
          <Route path="announcements" element={<CityAnnouncementsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
