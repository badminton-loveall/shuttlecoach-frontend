import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import HeadCoachDashboard from './pages/HeadCoachDashboard';
import StudentsPage from './pages/StudentsPage';
import FeesPage from './pages/FeesPage';
import CoachesPage from './pages/CoachesPage';
import CurriculumPage from './pages/CurriculumPage';
import StudentDashboard from './pages/StudentDashboard';
import MyProgressPage from './pages/MyProgressPage';
import MyFeesPage from './pages/MyFeesPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import './App.css';

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

          {/* Coach Routes (Head Coach & Assistant Coach) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <HeadCoachDashboard />
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
              <ProtectedRoute allowedRoles={['HEAD_COACH', 'ASSISTANT_COACH']}>
                <CurriculumPage />
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
