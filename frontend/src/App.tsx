import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/shared/AppLayout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import AdminLayout from "@/components/admin/AdminLayout";
import DoctorPatientsPage from "@/pages/admin/DoctorPatientsPage";
import PatientConsultationsPage from './pages/admin/PatientConsultationsPage'
import UpgradeRequests from '@/pages/admin/UpgradeRequests'
import Patients from '@/pages/admin/Patients'
import Dashboard from "@/pages/admin/Dashboard";
import Subscriptions from '@/pages/admin/Subscriptions'
import Organizations from "@/pages/admin/Organizations";
import OrganizationDetails from './pages/admin/OrganizationDetails'
import Usage from '@/pages/admin/Usage'
import Doctors from "@/pages/admin/Doctors";
import RegisterPage from '@/pages/RegisterPage'
import APIKeysPage from '@/pages/APIKeysPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import PatientsPage from '@/pages/PatientsPage'
import PatientDetailPage from '@/pages/PatientDetailPage'
import ConsultationsPage from '@/pages/ConsultationsPage'
import SoapEditorPage from '@/pages/SoapEditorPage'
import AIAnalysisPage from '@/pages/AIAnalysisPage'
import ReportsPage from '@/pages/ReportsPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import AuditPage from '@/pages/AuditPage'
import SettingsPage from '@/pages/SettingsPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'
import DictationPage from '@/pages/DictationPage'
import RadiologyViewerPage from '@/pages/RadiologyViewerPage'
import PatientDashboard from '@/pages/patient/PatientDashboard'
import MyReportsPage from '@/pages/patient/MyReportsPage'
import PatientReportPage from '@/pages/patient/PatientReportPage'
import OrganizationLayout from '@/components/organization/OrganizationLayout'
import OrganizationDashboard from '@/pages/organization/Dashboard'
import OrganizationDoctors from '@/pages/organization/Doctors'
import OrganizationPatients from '@/pages/organization/Patients'
import OrganizationReports from '@/pages/organization/Reports'
import OrganizationUsage from '@/pages/organization/Usage'
import OrganizationSubscription from '@/pages/organization/Subscription'
import OrganizationSettings from '@/pages/organization/Settings'
import DoctorDetails
from '@/pages/organization/DoctorDetails'
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected app routes */}


      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="radiology" element={<RadiologyViewerPage />} />
        <Route path="consultations" element={<ConsultationsPage />} />
        <Route path="consultations/:id/soap" element={<SoapEditorPage />} />
        <Route path="ai-analysis" element={<AIAnalysisPage />} />
        <Route path="dictation" element={<DictationPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="api-keys" element={<APIKeysPage />} />
      </Route>

      {/* Legacy redirects — keep old /dashboard etc. working */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/patients" element={<Navigate to="/app/patients" replace />} />
      <Route path="/consultations" element={<Navigate to="/app/consultations" replace />} />
      <Route path="/ai-analysis" element={<Navigate to="/app/ai-analysis" replace />} />
      <Route path="/dictation" element={<Navigate to="/app/dictation" replace />} />
      <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
      <Route path="/audit" element={<Navigate to="/app/audit" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      <Route path="/api-keys"element={<Navigate to="/app/api-keys" replace/>}/>

      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="organizations" element={<Organizations />}/>
      <Route
  path="organizations/:organizationId"
  element={<OrganizationDetails />}
/>
      <Route path="doctors" element={<Doctors />}/>
      <Route
  path="doctors/:doctorId/patients"
  element={<DoctorPatientsPage />}
/>
<Route
  path="patients/:patientId/consultations"
  element={<PatientConsultationsPage />}
/>
      <Route path="patients" element={<Patients />}/>
      <Route path="subscriptions" element={<Subscriptions />} />
      <Route path="usage" element={<Usage />} />
      <Route path="upgrade-requests" element={<UpgradeRequests />}/>
      
</Route>
<Route
  path="/patient/dashboard"
  element={
    <ProtectedRoute>
      <PatientDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/patient/reports"
  element={
    <ProtectedRoute>
      <MyReportsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/patient/reports/:reportId"
  element={
    <ProtectedRoute>
      <PatientReportPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/organization"
  element={
    <ProtectedRoute>
      <OrganizationLayout />
    </ProtectedRoute>
  }
>
  <Route
    index
    element={<OrganizationDashboard />}
  />

  <Route
    path="doctors"
    element={<OrganizationDoctors />}
  />
  <Route
  path="patients"
  element={<OrganizationPatients />}
/>
<Route
  path="reports"
  element={<OrganizationReports />}
/>
<Route
  path="usage"
  element={<OrganizationUsage />}
/>
<Route
  path="subscription"
  element={<OrganizationSubscription />}
/>
<Route
  path="settings"
  element={<OrganizationSettings />}
/>
<Route
  path="doctors/:doctorId"
  element={<DoctorDetails />}
 />
</Route>

      

<Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
