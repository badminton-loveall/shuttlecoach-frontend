import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import HeadCoachDashboard from './pages/HeadCoachDashboard';
import AssistantCoachDashboard from './pages/AssistantCoachDashboard';
import StudentsPage from './pages/StudentsPage';
import FeesPage from './pages/FeesPage';
import CoachesPage from './pages/CoachesPage';
import CoachDetailPage from './pages/CoachDetailPage';
import CurriculumBuilderPage from './pages/CurriculumBuilderPage';
import IndividualCurriculumPage from './pages/IndividualCurriculumPage';
import TrainingLogPage from './pages/TrainingLogPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfilePage from './pages/StudentProfilePage';
import MyProgressPage from './pages/MyProgressPage';
import MyFeesPage from './pages/MyFeesPage';
import MasterDataPage from './pages/MasterDataPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import HelpPage from './pages/HelpPage';
import DesignSystemTestPage from './pages/DesignSystemTestPage';
import ModernDesignSystemPage from './pages/ModernDesignSystemPage';
import AttendancePage from './pages/AttendancePage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import TrainingAnalyticsPage from './pages/TrainingAnalyticsPage';
import SessionCalendarPage from './pages/SessionCalendarPage';
import BatchSchedulePage from './pages/BatchSchedulePage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import CentersListPage from './pages/admin/CentersListPage';
import CreateCenterPage from './pages/admin/CreateCenterPage';
import CenterDetailPage from './pages/admin/CenterDetailPage';
import './App.css';

/**
 * RoleDashboard Component
 * Renders the appropriate dashboard based on user role
 */
const RoleDashboard: React.FC = () => {
  const { role } = useAuth();
  
  if (role === 'HEAD_COACH') {
    return <HeadCoachDashboard />;
  }
  
  if (role === 'ASSISTANT_COACH') {
    return <AssistantCoachDashboard />;
  }
  
  // Fallback (shouldn't happen due to ProtectedRoute)
  return <Navigate to="/access-denied" replace />;
};

/**
 * App Component
 * Root component that sets up routing and authentication context
 * Implements complete routing structure with role-based navigation
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Design System Test Page (Dev/Testing - No Auth Required) */}
          <Route path="/design-system" element={<DesignSystemTestPage />} />
          <Route path="/modern-design" element={<ModernDesignSystemPage />} />

          {/* Coach Routes (Head Coach & Assistant Coach) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <RoleDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <StudentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/fees"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH', 'ADMIN']} requireFeeAccess>
                <FeesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/curriculum"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH']}>
                <CurriculumBuilderPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/batch-schedule"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH']}>
                <BatchSchedulePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/curriculum/student/:studentId"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <IndividualCurriculumPage />
              </ProtectedRoute>
            }
          />

          {/* Student Profile (accessible by coaches) */}
          <Route
            path="/student/:id"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Training Log (accessible by coaches) */}
          <Route
            path="/training-log/:studentId"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <TrainingLogPage />
              </ProtectedRoute>
            }
          />

          {/* Head Coach Only - Coaches Management */}
          <Route
            path="/coaches"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH']}>
                <CoachesPage />
              </ProtectedRoute>
            }
          />

          {/* Master Data (Head Coach & Assistant Coach) */}
          <Route
            path="/master-data"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <MasterDataPage />
              </ProtectedRoute>
            }
          />

          {/* Attendance (Head Coach & Assistant Coach) */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          {/* Leave Requests (Head Coach & Assistant Coach) */}
          <Route
            path="/leave-requests"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <LeaveRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* Training Analytics (Head Coach & Assistant Coach) */}
          <Route
            path="/training-analytics"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <TrainingAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Session Calendar (All roles) */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH', 'STUDENT']}>
                <SessionCalendarPage />
              </ProtectedRoute>
            }
          />

          {/* Coach Detail Page */}
          <Route
            path="/coach/:coachId"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH', 'STUDENT']}>
                <CoachDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-progress"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MyProgressPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-fees"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MyFeesPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes (ADMIN role only) */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="centers" element={<CentersListPage />} />
            <Route path="centers/new" element={<CreateCenterPage />} />
            <Route path="centers/:id" element={<CenterDetailPage />} />
          </Route>

          {/* Access Denied Page */}
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Help Page (accessible to all authenticated users) */}
          <Route
            path="/help"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH', 'STUDENT']}>
                <HelpPage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
