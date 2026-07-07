import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import AccessDeniedPage from './pages/AccessDeniedPage';
import DesignSystemTestPage from './pages/DesignSystemTestPage';
import ModernDesignSystemPage from './pages/ModernDesignSystemPage';
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
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
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

          {/* Access Denied Page */}
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
