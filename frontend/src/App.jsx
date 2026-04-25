import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';

// Pages
import { Login } from './pages/Login';
// import { Register } from './pages/Register';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TestManager } from './pages/admin/TestManager';
import { QuestionManager } from './pages/admin/QuestionManager';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamInterface } from './pages/student/ExamInterface';
import { Result } from './pages/student/Result';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentProgress } from './pages/student/StudentProgress';
import { MistakesBook } from './pages/student/MistakesBook';
import { StudentManager } from './pages/admin/StudentManager';
import { AdminStudentDetail } from './pages/admin/AdminStudentDetail';
import { GlobalResults } from './pages/admin/GlobalResults';
import { StaffManager } from './pages/admin/StaffManager';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: { 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--card-border)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'var(--bg-secondary)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'var(--bg-secondary)',
              },
            },
            duration: 3500,
          }} 
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Dashboard Layouts */}
          <Route element={<MainLayout />}>
            {/* Student */}
            <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute role="student"><StudentProgress /></ProtectedRoute>} />
            <Route path="/mistakes" element={<ProtectedRoute role="student"><MistakesBook /></ProtectedRoute>} />
            <Route path="/result/:id" element={<ProtectedRoute role="student"><Result /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/tests" element={<ProtectedRoute role="admin"><TestManager /></ProtectedRoute>} />
            <Route path="/admin/tests/:testId/questions" element={<ProtectedRoute role="admin"><QuestionManager /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute role="admin"><StudentManager /></ProtectedRoute>} />
            <Route path="/admin/students/:studentId" element={<ProtectedRoute role="admin"><AdminStudentDetail /></ProtectedRoute>} />
            <Route path="/admin/results" element={<ProtectedRoute role="admin"><GlobalResults /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute role="admin"><StaffManager /></ProtectedRoute>} />
            
            {/* Super Admin */}
            <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><SuperAdminDashboard /></ProtectedRoute>} />
          </Route>

          {/* Full Screen Exam (No Layout) */}
          <Route path="/exam/:testId" element={<ProtectedRoute role="student"><ExamInterface /></ProtectedRoute>} />
          
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
